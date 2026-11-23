import { Component,ViewChild, OnInit,signal } from '@angular/core';
import { addIcons } from 'ionicons';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonButton, IonContent,RefresherCustomEvent,ReorderEndCustomEvent } from '@ionic/angular';
import { library, playCircle, radio, search,barbell, basket, globe, heart, home, person, pin, star, trash,trashBin ,
  airplane, bluetooth, call, wifi,caretDownCircle,close, closeCircle,add, chevronBack, chevronDown, chevronForward, 
  chevronUp,  } from 'ionicons/icons';
@Component({
  selector: 'app-component',
  templateUrl: './component.page.html',
  styleUrls: ['./component.page.scss'],
  standalone: false,
})
export class ComponentPage implements OnInit {
  toastButtons = [
    {
      text: 'Action With Long Text',
    },
  ];
  public data = [
    'Amsterdam',
    'Buenos Aires',
    'Cairo',
    'Geneva',
    'Hong Kong',
    'Istanbul',
    'London',
    'Madrid',
    'New York',
    'Panama City',
  ];
  public results = [...this.data];

  handleInput(event: Event) {
    const target = event.target as HTMLIonSearchbarElement;
    const query = target.value?.toLowerCase() || '';
    this.results = this.data.filter((d) => d.toLowerCase().includes(query));
  }
  public isDisabled = true;
customAlertOptions = {
    header: 'Pizza Toppings',
    subHeader: 'Select your favorite topping',
    message: 'Choose only one',
    translucent: true,
  };

  customPopoverOptions = {
    header: 'Hair Color',
    subHeader: 'Select your hair color',
    message: 'Only select your dominant hair color',
  };

  customActionSheetOptions = {
    header: 'IPl Team',
    subHeader: 'Select your favorite IPL Team',
  };

  customModalOptions = {
    header: 'Favorite Chocalate',
    breakpoints: [0, 0.5],
    initialBreakpoint: 0.5,
  };
  handleReorderEnd(event: ReorderEndCustomEvent) {
    // The `from` and `to` properties contain the index of the item
    // when the drag started and ended, respectively
    console.log('Dragged from index', event.detail.from, 'to', event.detail.to);

    // Finish the reorder and position the item in the DOM based on
    // where the gesture ended. This method can also be called directly
    // by the reorder group.
    event.detail.complete();
  }

  toggleReorder() {
    this.isDisabled = !this.isDisabled;
  }
   pinFormatter(value: number) {
    return `${value}%`;
  }
  handleRefresh(event: RefresherCustomEvent) {
    setTimeout(() => {
      // Any calls to load data go here
      event.target.complete();
    }, 2000);
  }
  items: string[] = [];

  isWeekday = (dateString: string) => {
    
    const date = new Date(dateString);
    const utcDay = date.getUTCDay();

    /**
     * Date will be enabled if it is not
     * Sunday or Saturday
     */
    return utcDay !== 0 && utcDay !== 6;
  }
  @ViewChild(IonContent) content!: IonContent;

async scrollToBottom() {
  await this.content.scrollToBottom(500);
  console.log('Scrolled to bottom');
}

async scrollToTop() {
  await this.content.scrollToTop(500);
  console.log('Scrolled to top');
}
  myForm: FormGroup;
customCounterFormatter(inputLength: number, maxLength: number) {
    return `${maxLength - inputLength} characters remaining`;
  }
  readonly buffer = signal(0.06);
  readonly progress = signal(0);
  constructor(private fb: FormBuilder) {
    this.myForm = this.fb.group({
      agree: [false, Validators.requiredTrue],
    });
    setInterval(() => {
      this.buffer.update((value) => value + 0.06);
      this.progress.update((value) => value + 0.06);

      // Reset the progress bar when it reaches 100%
      // to continuously show the demo
      if (this.progress() > 1) {
        setTimeout(() => {
          this.buffer.set(0.06);
          this.progress.set(0);
        }, 1000);
      }
    }, 1000);
    addIcons({ library, playCircle, radio, search,barbell, basket, call, globe, heart, home, person, pin, star, trash,airplane,
       bluetooth, wifi,add, chevronBack, chevronDown, chevronForward, chevronUp,close,trashBin , closeCircle,caretDownCircle });
  }
  onSubmit() {
    this.myForm.get('agree')!.markAsTouched();
  }
  ngOnInit() {
    for (let i = 1; i < 51; i++) {
      this.items.push(`Item ${i}`);
    }
  }
  public actionSheetButtons = [
    {
      text: 'Delete',
      role: 'destructive',
      data: {
        action: 'delete',
      },
    },
    {
      text: 'Share',
      data: {
        action: 'share',
      },
    },
    {
      text: 'Cancel',
      role: 'cancel',
      data: {
        action: 'cancel',
      },
    },
  ];
public alertButtons = ['OK'];
  public alertInputs = [
    {
      placeholder: 'Name',
    },
    {
      placeholder: 'Nickname (max 8 characters)',
      attributes: {
        maxlength: 8,
      },
    },
    {
      type: 'number',
      placeholder: 'Age',
      min: 1,
      max: 100,
    },
    {
      type: 'textarea',
      placeholder: 'A little about yourself',
    },
  ];  
public alertButtons1 = ['OK'];
  public alertInputs1 = [
    {
      label: 'Red',
      type: 'radio',
      value: 'red',
    },
    {
      label: 'Blue',
      type: 'radio',
      value: 'blue',
    },
    {
      label: 'Green',
      type: 'radio',
      value: 'green',
    },
  ];
  maxBreadcrumbs? = 4;

  expandBreadcrumbs() {
    this.maxBreadcrumbs = undefined;
  }

  focusElement(id: string) {
    const el = document.querySelector(id) as HTMLElement;

    const app = el.closest('ion-app');
    if (app) {
      app.setFocus([el]);
    }
  }
}

