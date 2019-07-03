import { Injectable } from '@angular/core';
import { b2b } from '../../b2b';
import { HttpClient } from '@angular/common/http';
import { Location } from '@angular/common';
import { Subject } from 'rxjs/Subject';
import { ConfigService } from './config.service';

@Injectable()
export class GroupsService {

    rootGroupId: number;
    currentGroupId: number;
    childGroups: b2b.Group[];
    history: b2b.Breadcrumb[];

    groupChanged: Subject<number>;
    groupsLoaded: Subject<{ id: number, history: b2b.Breadcrumb[] }>;
    productsChanged: Subject<{ id: number, history: b2b.Breadcrumb[] }>;

    constructor(
        private httpClient: HttpClient,
        private location: Location,
        private configService: ConfigService
    ) {

        this.rootGroupId = 0;
        this.currentGroupId = 0;
        this.childGroups = [];
        this.history = [{ 'id': 0, 'name': ''}];

        this.groupChanged = new Subject<number>();
        this.groupsLoaded = new Subject<{ id: number, history: b2b.Breadcrumb[] }>();
        this.productsChanged = new Subject<{ id: number, history: b2b.Breadcrumb[] }>();
    }


    /**
     * Makes requret for current level categories
     */
    private groupsRequest(groupId: number): Promise<b2b.GroupsResponse> {

        return this.httpClient.get<b2b.GroupsResponse>(`api/items/tree/${groupId}`).toPromise();
    }

    /**
     * Changes current group to given one, or to root if no group is given.
     * Loads group children, updates model and returns promise with updated groups data.
     */
    goToGroup(groupId = 0, isExpand: 0 | 1): Promise<b2b.GroupsData> {

        if (groupId === 0 || this.currentGroupId !== groupId) {

            this.groupChanged.next(groupId);

            let promise: Promise<void> = null;

            const currentGroup = this.childGroups.find(item => item.id === groupId);
            const anyActive = !!this.childGroups.find(item => !!item.isActive);

            if (isExpand === 1 || (!currentGroup && !anyActive)) {

                promise = this.groupsRequest(groupId).then((res) => {

                    this.childGroups = res.set1;

                    if (res.set2.length === 0) {
                        this.history = [this.childGroups[0]];
                    } else {
                        this.history = res.set2;
                    }

                    this.rootGroupId = this.history[0].id;

                });

            } else {

                //if group has no children or the same parent - don't request new groups. Visible groups are the same.
                if (currentGroup) {

                    //if current group exists in child groups - it means we are going forward

                    if (anyActive) {

                        //non expandable sibling
                        this.history[this.history.length - 1] = currentGroup;

                    } else {

                        //non expandable child
                        if (this.currentGroupId !== currentGroup.id) {
                            this.history.push(currentGroup);
                        }
                    }
                } else {

                    //if current group doesn't exists in child groups - it means we are going backward
                    this.history.splice(-1);
                }


                promise = Promise.resolve();
            }

            
            

            return promise.then(() => {

                this.currentGroupId = groupId;
                
                const groupInLink = Number(this.location.path(false).split('/').slice(-1));

                if (this.location.path().toLowerCase().includes('items') && groupInLink !== groupId) {
                    this.location.go('/Items/' + groupId);
                }



                this.childGroups.forEach(item => {
                    item.isActive = (item.id === this.currentGroupId);
                });

                this.groupsLoaded.next({ id: this.currentGroupId, history: this.history });

                return {
                    currentGorupId: this.currentGroupId,
                    childGroups: this.childGroups,
                    history: this.history,
                };

            });
        } else {
            return Promise.resolve({
                currentGorupId: this.currentGroupId,
                childGroups: this.childGroups,
                history: this.history,
            });
        }

        

    }


    backToPreviousGroup() {

        const previousGroup = this.history[this.history.length - 2];
        const isExpanded = previousGroup.id !== 0 && this.history.length > 1;
        this.goToGroup(previousGroup.id, <0 | 1>Number(isExpanded));
    }

    goToNewList(groupId = 0, isExpand: 0 | 1): Promise<b2b.GroupsData> {

        return this.goToGroup(groupId, isExpand).then((res) => {

            this.productsChanged.next({ id: this.currentGroupId, history: this.history });
            return res;
        });

    }
}
