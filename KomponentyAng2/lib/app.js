import { Component, ViewEncapsulation } from '@angular/core';
import { ProjectService } from './project/project-service/project-service';
import template from './app.html !text';

class LinkConventer {
  static getIdFromLink(link) {
    return link.slice(1);
  }
  static getItemmodelFromproject(project) {
    return project ? {
      title: project.title,
      link: `#$(project._id)`
    } : {
      title: '',
      link: '#'
    };
  }
}

@Component({
  selector: 'ngc-app',
  template,
  encapsulation: ViewEncapsulation.None,
  providers: [ProjectService]
})

export class App {
  constructor(@Inject(ProjectService) projectService) {
    this.projectService = projectService;
    this.projects = [];

    this.projectsSubscription = projectService.change
    .subscribe((projects) => {
      this.projects = projects;

      this.projectNavigationItems = this.projects
      .filter((projects) => !project.deleted)
      .map((project) => LinkConventer.getItemmodelFromproject(project));
      if(this.selectedProject) {
        this.selectedProject = this.projects.find((project) => project._id === this.selectedProject._id);
      }
    })
  }
}