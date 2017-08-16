// Potrzebujemy dekoratora Component oraz wyliczenia ViewEncapsulation.
import {Component, ViewEncapsulation, Inject} from '@angular/core';
import {ProjectService} from './project/project-service/project-service';
import template from './app.html!text';

// Klasa pomocnicza zamieniająca adresy URI na identyfikatory projektu i generująca modele łącz.
class LinkConverter {
  static getIdFromLink(link) {
    return link.slice(1);
  }

  static getItemModelFromProject(project) {
    return project ? {
      title: project.title,
      link: `#${project._id}`
    } : {
      title: '',
      link: '#'
    };
  }
}

// W ten sposób tworzymy główną treść aplikacji.
@Component({
  // Informuje Angular, aby szukał elementu <ngc-app> w celu utworzenia tego komponentu.
  selector: 'ngc-app',
  // Wykorzystajmy treść wczytanego szablonu HTML.
  template,
  // Poinformuj Angular, aby ignorował enkapsulację widoku.
  encapsulation: ViewEncapsulation.None,
  providers: [ProjectService]
})
export class App {
  constructor(@Inject(ProjectService) projectService) {
    this.projectService = projectService;
    this.projects = [];

    // Konfiguracja subskrypcji RxJS w celu otrzymywania zmian w projekcie.
    this.projectsSubscription = projectService.change
      // Subskrybujemy zmiany w obserwatorze change.
      .subscribe((projects) => {
        this.projects = projects;
        // Utworzenie nowych elementów nawigacyjnych.
        this.projectNavigationItems = this.projects
          .filter((project) => !project.deleted)
          .map((project) => LinkConverter.getItemModelFromProject(project));
        // Jeśli był wybrany projekt, próbujemy wybrać ten sam z nowej listy.
        if (this.selectedProject) {
          this.selectedProject = this.projects.find((project) => project._id === this.selectedProject._id);
        }
      });
  }

  // Używa konwertera, aby wygenerować identyfikator łącza dla aktualnie wybranego projektu.
  getSelectedProjectLink() {
    return LinkConverter.getItemModelFromProject(this.selectedProject).link;
  }

  // Funkcja ustawi wartość selectedProject na podstawie identyfikatora łącza.
  selectProjectByLink(link) {
    this.selectedProject = this.projects
      .find((project) => project._id === LinkConverter.getIdFromLink(link));
  }

  // Funkcja aktualizuje dane wybranego projektu na podstawie danych z parametru, a następnie zapamiętuje zmianę w bazie danych.
  updateSelectedProject(projectData) {
    Object.assign(this.selectedProject, projectData);
    this.projectService.dataProvider.createOrUpdateDocument(this.selectedProject);
  }

  // Jeśli komponent jest niszczony, musimy zakończyć subskrypcję.
  ngOnDestroy() {
    this.projectsSubscription.unsubscribe();
  }
}
