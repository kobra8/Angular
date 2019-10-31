import { Injectable } from '@angular/core';
import { b2b } from '../../b2b';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Location } from '@angular/common';
import { Subject } from 'rxjs';

@Injectable()
export class GroupsService {

    rootGroupId: number;
    currentGroupId: number;
    childGroups: b2b.Group[];
    history: b2b.Breadcrumb[];
    isAnyActive: boolean;

    groupChanged: Subject<number>;
    groupsLoaded: Subject<{ id: number, history: b2b.Breadcrumb[] }>;
    productsChanged: Subject<{ id: number, history: b2b.Breadcrumb[] }>;

    constructor(
        private httpClient: HttpClient,
        private location: Location,
    ) {

        this.rootGroupId = 0;
        this.currentGroupId = 0;
        this.childGroups = [];
        this.history = [{ 'id': 0, 'name': '' }];

        this.groupChanged = new Subject<number>();
        this.groupsLoaded = new Subject<{ id: number, history: b2b.Breadcrumb[] }>();
        this.productsChanged = new Subject<{ id: number, history: b2b.Breadcrumb[] }>();
    }


    /**
     * Makes requret for current level categories
     */
    private groupsRequest(groupId: number): Promise<b2b.GroupsResponse> {

        return this.httpClient.get<b2b.GroupsResponse>(`/api/items/tree/${groupId}`).toPromise();
    }

    /**
     * Changes current group to given one, or to root if no group is given.
     * Loads group children, updates model and returns promise with updated groups data.
     */
    goToGroup(groupId = 0, isExpand: 0 | 1): Promise<b2b.GroupsData | HttpErrorResponse> {

        if (Number.isNaN(groupId)) {
            return Promise.resolve({
                currentGorupId: 0,
                childGroups: [],
                history: [],
            });
        }

        if (groupId === 0 || this.currentGroupId !== groupId) {

            this.groupChanged.next(groupId);

            let promise: Promise<void | HttpErrorResponse> = null;

            const currentGroup = this.childGroups.find(item => item.id === groupId);
            this.isAnyActive = !!this.childGroups.find(item => !!item.isActive);

            if (isExpand === 1 || (!currentGroup && !this.isAnyActive)) {

                promise = this.groupsRequest(groupId).then((res) => {

                    if (res.set1.length === 0 && (!res.set2 || res.set2.length === 0)) {
                        return this.groupsRequest(0);
                    }

                    return res;

                }).then((res) => {

                    this.childGroups = res.set1;

                    if (res.set2.length === 0) {
                        this.history = [this.childGroups[0]];
                    } else {
                        this.history = res.set2;
                    }

                    this.rootGroupId = this.history[0].id;

                }).catch(err => {
                    this.history[this.history.length - 1] = currentGroup;
                    return Promise.reject(err);
                });

            } else {

                //if group has no children or the same parent - don't request new groups. Visible groups are the same.
                if (currentGroup) {

                    //if current group exists in child groups - it means we are going forward

                    if (this.isAnyActive) {

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

                this.isAnyActive = false;

                this.childGroups.forEach(item => {
                    item.isActive = (item.id === this.currentGroupId);
                    if (item.isActive) {
                        this.isAnyActive = true;
                    }
                });

                this.groupsLoaded.next({ id: this.currentGroupId, history: this.history });

                return {
                    currentGorupId: this.currentGroupId,
                    childGroups: this.childGroups,
                    history: this.history,
                };

            }).catch((err: HttpErrorResponse) => {

                this.currentGroupId = groupId;

                this.isAnyActive = false;

                this.childGroups.forEach(item => {
                    item.isActive = (item.id === this.currentGroupId);


                    if (item.isActive) {
                        this.isAnyActive = true;
                    }
                });

                this.groupsLoaded.next({ id: this.currentGroupId, history: this.history });

                return Promise.reject(Object.assign(
                    err,
                    {
                        message: {
                            currentGorupId: this.currentGroupId,
                            childGroups: this.childGroups,
                            history: this.history,
                        }
                    }
                ));

            });

        } else {

            this.groupsLoaded.next({ id: this.currentGroupId, history: this.history });

            return Promise.resolve({
                currentGorupId: this.currentGroupId,
                childGroups: this.childGroups,
                history: this.history,
            });
        }



    }


    backToPreviousGroup(): Promise<b2b.GroupsData | HttpErrorResponse> {

        let previousGroup = this.history[this.history.length - 2];
        const isAnyActive = this.childGroups.find(group => group.isActive);

        if (isAnyActive) {
            previousGroup = this.history[this.history.length - 3];
        }

        const isExpanded = previousGroup.id !== 0 && this.history.length > 1;

        return this.goToGroup(previousGroup.id, <0 | 1>Number(isExpanded));
    }

    goToNewList(groupId = 0, isExpand: 0 | 1): Promise<b2b.GroupsData | HttpErrorResponse> {

        return this.goToGroup(groupId, isExpand).then((res) => {


            this.productsChanged.next({ id: this.currentGroupId, history: this.history });

            const groupInLink = Number(this.location.path(false).split('/').slice(-1));

            if (this.location.path().toLowerCase().includes('items') && groupInLink !== groupId) {
                this.location.go('/items/' + groupId);
            }

            return res;
        }).catch(err => {

            this.productsChanged.next({ id: this.currentGroupId, history: this.history });

            const groupInLink = Number(this.location.path(false).split('/').slice(-1));

            if (this.location.path().toLowerCase().includes('items') && groupInLink !== groupId) {
                this.location.go('/items/' + groupId);
            }

            return Promise.reject(err);
        });

    }
}
