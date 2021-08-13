
// Project Types
enum ProjectStatus { Active, Finished };

class Project {
  constructor(
    public id: string,
    public title: string,
    public description: string,
    public people: number,
    public status: ProjectStatus
  ){}
}

type Listener = (items: Project[]) => void

// Project State Management
class ProjectState {
  private listeners: Listener[] = [];
  private projects: Project[] = [];
  private static instance: ProjectState;

  private constructor() {
    
  }

  addListener(listenerFn: Listener) {
    this.listeners.push(listenerFn);
  }

  static getInstance() {
    if (this.instance) {
      return this.instance;
    }
    this.instance = new ProjectState();
    return this.instance;
  }

  addProject(title: string, description: string, numOfPeople: number) {
    const newProject = new Project(
      Math.random().toString(),
      title,
      description,
      numOfPeople,
      ProjectStatus.Active
    );
    this.projects.push(newProject);

    for (const listenerFn of this.listeners) {
      listenerFn(this.projects.slice());
    }
  }
}

const projectsState = ProjectState.getInstance();

// Validation
interface Validatable {
  value: string | number;
  required?: boolean;
  minLen?: number;
  maxLen?: number;
  min?: number;
  max?: number;
};

function validate(input: Validatable) {
  let isValid = true;

  if (input.required) {
    isValid = isValid && input.value.toString().trim().length !== 0;
  }
  if (input.minLen != null && typeof input.value === 'string') {
    isValid = isValid && input.value.length >= input.minLen;
  }
  if (input.maxLen != null && typeof input.value === 'string') {
    isValid = isValid && input.value.length <= input.maxLen;
  }
  if (input.min != null && typeof input.value === 'number') {
    isValid = isValid && <number>input.value >= input.min;
  }
  if (input.max != null && typeof input.value === 'number') {
    isValid = isValid && <number>input.value <= input.max;
  }
  return isValid;
}

// Bind 'this' automatically
function autobind(
  _target: any,
  _methodName: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;
  const adjDescriptor: PropertyDescriptor = {
    configurable: true,
    get() {
      const boundFn = originalMethod.bind(this);
      return boundFn;
    },
  };
  return adjDescriptor;
}

class ProjectList {
  templateEl: HTMLTemplateElement;
  hostEl: HTMLDivElement;
  element: HTMLElement;
  assignedProjects: Project[];

  constructor(private type: 'active' | 'finished') {
    this.assignedProjects = [];
    this.templateEl = document.getElementById(
      "project-list"
    )! as HTMLTemplateElement;
    this.hostEl = document.getElementById("app")! as HTMLDivElement;

    const importedNode = document.importNode(this.templateEl.content, true);
    this.element = importedNode.firstElementChild as HTMLElement;
    this.element.id = `${this.type}-projects`;
    
    projectsState.addListener((projects: Project[]) => {
      this.assignedProjects = projects;
      this.renderProjects();
    })
    this.attach();
    this.renderContent()
  }

  renderProjects() {
    const listEl = document.getElementById(`${this.type}-projects-list`)! as HTMLUListElement;
    for (const projItem of this.assignedProjects) {
      const listItem = document.createElement('li');
      listItem.textContent = projItem.title;
      listEl.appendChild(listItem); 
    }
  }

  private renderContent() {
    const listId = `${this.type}-projects-list`;
    this.element.querySelector('ul')!.id = listId;
    this.element.querySelector('h2')!.textContent = this.type.toUpperCase() + ' Projects';
  }

  private attach() {
    this.hostEl.insertAdjacentElement("beforeend", this.element);
  }
}

// Project Input
class ProjectInput {
  templateEl: HTMLTemplateElement;
  hostEl: HTMLDivElement;
  element: HTMLFormElement;
  titleInputEl: HTMLInputElement;
  descriptionInputEl: HTMLInputElement;
  peopleInputEl: HTMLInputElement;

  constructor() {
    this.templateEl = document.getElementById(
      "project-input"
    )! as HTMLTemplateElement;
    this.hostEl = document.getElementById("app")! as HTMLDivElement;

    const importedNode = document.importNode(this.templateEl.content, true);
    this.element = importedNode.firstElementChild as HTMLFormElement;
    this.element.id = "user-input";

    this.titleInputEl = this.element.querySelector(
      "#title"
    )! as HTMLInputElement;
    this.descriptionInputEl = this.element.querySelector(
      "#description"
    )! as HTMLInputElement;
    this.peopleInputEl = this.element.querySelector(
      "#people"
    )! as HTMLInputElement;

    this.configure();
    this.attach();
  }

  private gatherUserInput(): [string, string, number] | void {
    const title = this.titleInputEl.value;
    const description = this.descriptionInputEl.value;
    const people = this.peopleInputEl.valueAsNumber;

    const titleValidatable: Validatable = {
      value: title,
      required: true,
      minLen: 2,
      maxLen: 8
    };
    const descriptionValidatable: Validatable = {
      value: description,
      required: true,
      minLen: 2,
      maxLen: 8
    };
    const peopleValidatable: Validatable = {
      value: people,
      required: true,
      min: 1,
      max: 5
    };

    if (
      !validate(titleValidatable) ||
      !validate(descriptionValidatable) ||
      !validate(peopleValidatable)
    ) {
      alert("Invalid input, please try again");
      return;
    } else {
      return [title, description, people];
    }
  }

  private clearInputs() {
    this.titleInputEl.value = "";
    this.descriptionInputEl.value = "";
    this.peopleInputEl.value = "";
  }

  @autobind
  private submitHandler(event: Event) {
    event.preventDefault();
    const userInput = this.gatherUserInput();

    if (Array.isArray(userInput)) {
      const [title, description, people] = userInput;
      projectsState.addProject(title, description, people);
      this.clearInputs();
    }
  }

  private configure() {
    this.element.addEventListener("submit", this.submitHandler);
  }

  private attach() {
    this.hostEl.insertAdjacentElement("afterbegin", this.element);
  }
}

const projectInput = new ProjectInput();
const activeProjectList = new ProjectList('active');
const finishedProjectList = new ProjectList('finished');