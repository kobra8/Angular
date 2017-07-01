// Potrzebujemy dekoratora Component oraz wyliczenia ViewEncapsulation.
import {Component, ViewEncapsulation, Inject} from '@angular/core';
import { ProjectService } from './project/project-service/project-service'
// Za pomocą wczytywania tekstowego możemy zaimportować szablon.
import template from './app.html!text';

// Klasa pomocnicza zmieniająca adresy URL na identyfikatory projektu i generująca modele łączy
class LinkConventer {
  static getIdFromLink(link) {
    return link.slice(1);
  }
  static getItemModelFromproject(project) {
    return project ? {
      title: project.title,
      link:`3${project._id}`
    } : {
      title: '',
      link: `#`
    }
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

    //Konfiguracja subskrypcji RxJS w celu otrzymywania zmian w projekcie
    this.projectSubscription = projectService.change
    //Subskrybujemy zmiany w obiekcie change.
    .subscribe((projects) => {
      this.projects = projects;
      //Utworzenie nowych elementów nawigacyjnych
      this.projectNavigationItems = this.projects
      .filter((project) => !project.deleted)
      .map((project) => LinkConventer.getItemModelFromproject(project));
      //Jeśli został wybrany projekt, próbujemy wybrać ten sam z nowej listy.
      if(this.selectedProject) {
        this.selectedProject = this.projects.find((project) => project._id === this.selectedProject._id);
      }
    });
  }
//Uzywa konwertera, aby wygenerować identfikator łącza dla altualnie wybranego projektu
getSelectedProjectLink() {
  return LinkConventer.getItemModelFromproject(this.selectedProject).link;
}
//Funkcja ustawi wartość selectedProject na podstawie identyfiakatora łącza
selectProjectByLink(link) {
  this.selectedProject = this.projects
  .find((project) => project._id === LinkConventer.getIdFromLink(link));
}

//Funkcja aktualizuje dane wybranego projektu na podstawie danych z prarmetru, a następnie zapamiętuje zmianę w bazie
updateSelectedProject(projectData) {
  Object.assign(this.selectedProject, projectData);
  this.projectService.dataProvider.createOrUpdateDocument(this.selectedProject);
}  
//Jesli komponent jest niszczony, musimy zakończyć subskrypcję
ngOnDestroy() {
  this.projectSubscription.unsubscribe();
}

} //Koniec klasy App
