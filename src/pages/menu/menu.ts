import { Component, ViewChild } from '@angular/core';
import { NavController, NavParams, Events, ModalController, ViewController, AlertController, ToastController, Platform  } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { DiscountsPage } from '../discounts/discounts';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Intercom } from '@ionic-native/intercom';

import firebase from 'firebase';

declare var window;
declare var intercom;

@Component({
  selector: 'page-menu',
  templateUrl: 'menu.html',
})
export class MenuPage {

  menuGroup: Array<{
    menuGroupName: string,
    menu: Array<{
      name: string, description: string, price: number
    }>
  }>;

  isDisabled: boolean = false;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public modalCtrl: ModalController,
    public events: Events,
    public storage: Storage,
    public alertCtrl: AlertController,
    public toastCtrl: ToastController,
    public plt: Platform,
    private intercom: Intercom
  ) {

    let user = firebase.auth().currentUser;
    var menuArr = [];

    firebase.database().ref('Restaurant Profiles/' + user.uid).child('stripe').once('value', (snapshot) => {
      let data = snapshot.val();

      if(data.plan === "none" || data.plan === "InstaEats_basicP"){
        this.isDisabled = true;
      } else {
        this.isDisabled = false;
      }
    });

    firebase.database().ref('/MenuItems/' + user.uid).once("value", (snapshot) => {
      var data = snapshot.val();

      for (var menuG in data){
        var menuGE = {menuGroupName: menuG, menu: []};

        snapshot.child(menuG).forEach((childSnapshot) => {
          var childData = childSnapshot.val();
          var menuI = {name: childData.name, description: childData.description, price: childData.price};
          menuGE.menu.push(menuI);
          return false;
        });
        menuArr.push(menuGE);
      }

      this.storage.set('restMenu', menuArr);
      this.menuGroup = menuArr;
    });
  };

  ionViewDidEnter() {

    if (this.plt.is('cordova')) {
        intercom.setLauncherVisibility('VISIBLE');
        intercom.updateUser({
          custom_attributes: {
            on_page : "Restaurant Mobile Dash / Menu"
        }
      });
    } else {

    window.Intercom('update', {on_page: 'Restaurant Dash / Menu'});
  }
  }

  // Push menu to firebase
  updateMenu(){
    let uid = firebase.auth().currentUser.uid;
    let menuNode = firebase.database().ref("MenuItems");
    let length = this.menuGroup.length;

    let childNode = menuNode.child(uid);
    for (var i = 0; i < length; i++) {
      childNode.update({
        [this.menuGroup[i].menuGroupName]: this.menuGroup[i].menu
      });
    }
    let toast = this.toastCtrl.create({
      message: "Menu Updated",
      duration: 3000,
      position: 'bottom'
    })
    toast.present();
  }

  addMenuGroup(){
    var menuItem = {name : "", description: "", price: 0.00};
    var menuGroupElem = {menuGroupName: "", menu: [menuItem]};
    this.menuGroup.push(menuGroupElem);
  };

  addMenuItem(index){
    var menuItem = {name : "", description: "", price: 0.00};
    this.menuGroup[index].menu.push(menuItem);
  };

  removeGroup(index){
    let uid = firebase.auth().currentUser.uid;
    let menuNode = firebase.database().ref("MenuItems/" + uid);
    let length = this.menuGroup.length;


    const alert = this.alertCtrl.create({
      title: 'Confirm delete',
      message: 'Do you want to delete this group?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            console.log('Cancel clicked');
          }
        },
        {
          text: 'Delete',
          handler: () => {
            try{
              let childNode = menuNode.child(this.menuGroup[index].menuGroupName);
              childNode.remove();
              this.menuGroup.splice(index,1);
            } catch(err){
              this.menuGroup.splice(index,1);
            }
          }
        }
      ]
    });
    alert.present();

  };

  removeItem(menu, item){
    let uid = firebase.auth().currentUser.uid;
    let menuNode = firebase.database().ref("MenuItems/" + uid);
    let length = this.menuGroup.length;

    const alert = this.alertCtrl.create({
      title: 'Confirm delete',
      message: 'Do you want to delete this item?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            console.log('Cancel clicked');
          }
        },
        {
          text: 'Delete',
          handler: () => {

            try{
              let childNode = menuNode.child(this.menuGroup[menu].menuGroupName);
              childNode.child(item).remove();
              this.menuGroup[menu].menu.splice(item, 1);
            } catch (err) {
              this.menuGroup[menu].menu.splice(item, 1);
            }
          }
        }
      ]
    });
    alert.present();
  };

  createBundle(){
    let modal = this.modalCtrl.create(ModalContentPage, this.menuGroup);
    modal.present();
  };

};

@Component({
  template: `
  <ion-header>
    <ion-toolbar>
      <ion-title>
        Create Coupon
      </ion-title>
      <ion-buttons start>
        <button ion-button (click)="dismiss()">
          Cancel
        </button>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>

  <ion-content>

    <p *ngIf="readyToSubmit" style="color: #ea6153;"> Please fill out coupon Name and Description</p>

    <form [formGroup]="coupDesc">
    <ion-item>
      <ion-input type="text" placeholder="Coupon Name (required)" maxlength=120 formControlName="bundleName" [class.invalid]="!coupDesc.controls.bundleName.valid && (coupDesc.controls.bundleName.dirty || readyToSubmit)"></ion-input>
    </ion-item>
    <ion-item *ngIf="!coupDesc.controls.bundleName.valid  && (coupDesc.controls.bundleName.dirty || readyToSubmit)">
          <p>Required</p>
      </ion-item>
    <ion-item>
      <ion-input type="text" placeholder="Coupon Description (required)" maxlength=400 formControlName="bundleDescription" [class.invalid]="!coupDesc.controls.bundleDescription.valid && (coupDesc.controls.bundleDescription.dirty || readyToSubmit)"></ion-input>
    </ion-item>
    <ion-item *ngIf="!coupDesc.controls.bundleDescription.valid  && (coupDesc.controls.bundleDescription.dirty || readyToSubmit)">
          <p>Required</p>
      </ion-item>
    </form>
    <br>

    <ion-list *ngFor="let menug of bundleMenu; let i = index">
      <ion-card class="cardNot">
        <ion-card-header style="background-color: #da3937; color: white;">
          {{menug.menuGroupName}}
        </ion-card-header>

        <ion-grid>
          <ion-row style="line-height: 1.5em;">
            <ion-col col-2 col-auto >
            </ion-col>
            <ion-col col-4 col-auto>
              Item Name
            </ion-col>
            <ion-col col-2 col-auto>
              Price
            </ion-col>
            <ion-col col-2 col-auto>
              $'s off
            </ion-col>
            <ion-col col-2 col-auto>
              % off
            </ion-col>
          </ion-row>
        </ion-grid>

        <ion-grid>
          <ion-item-group *ngFor="let menu of menug.menu; let j = index">
            <ion-row>
              <ion-col col-2 col-auto >
              </ion-col>
              <ion-col col-4 col-auto> Item Name </ion-col>
              <ion-col col-2 col-auto> Price </ion-col>
              <ion-col col-2 col-auto> New Price </ion-col>
              <ion-col col-2 col-auto> % off </ion-col>
            </ion-row>
          </ion-item-group>
        </ion-grid>
            </ion-card>
    </ion-list>

    <ion-grid>
      <ion-item-group *ngFor="let menu of menug.menu; let j = index">
        <ion-row>

          <ion-col col-2 col-auto >
            <ion-checkbox style="margin:0px; padding:0px;" [(ngModel)]="bundleMenu[i].menu[j].checked" (click)='sumTotal()'></ion-checkbox>
          </ion-col>

          <ion-col col-4 col-auto >
            <ion-label style="margin:0px; padding:0px;"> {{menu.name}} </ion-label>
          </ion-col>

          <ion-col col-2 col-auto >
            $ {{menu.price}}
          </ion-col>

          <ion-col col-2 col-auto style="margin:0px; padding:0px;">
            <ion-input style="margin:0px; padding:0px;" [disabled]=!bundleMenu[i].menu[j].checked [(ngModel)]="bundleMenu[i].menu[j].discount" (change)='sumTotalPrice(i,j)'></ion-input>
          </ion-col>

          <ion-col col-2 col-auto style="margin:0px; padding:0px;">
            <ion-input style="margin:0px; padding:0px;" [disabled]=!bundleMenu[i].menu[j].checked [(ngModel)]="bundleMenu[i].menu[j].percent" (change)='sumTotalPercent(i,j)'></ion-input>
          </ion-col>

        </ion-row>
      </ion-item-group>
    </ion-grid>

<ion-grid>
  <ion-row>
    <ion-col col-6>
    </ion-col>
    <ion-col col-2> Total Price </ion-col>
    <ion-col col-2> Total $'s off </ion-col>
    <ion-col col-2> Total % off </ion-col>
  </ion-row>

  <ion-row>
    <ion-col col-6>

    </ion-col>
    <ion-col col-2> {{totalPrice}} </ion-col>
    <ion-col col-2> $ {{totalDiscountPrice}} </ion-col>
    <ion-col col-2> {{totalDiscountPercent}} % </ion-col>
  </ion-row>
</ion-grid>

<br>

<div text-center>
  <button ion-button large icon-right color="rdaApp" (click)="saveBundle()">
    Save Bundle
    <ion-icon name="pricetags"></ion-icon>
  </button>
</div>
</ion-content>
`
})
export class ModalContentPage {
  private coupDesc : FormGroup;
  readyToSubmit: boolean = false;

  menuGroup: Array<{
    menuGroupName:         string,
    menu:                  Array<{
      name: string, description: string, price: number
    }>
  }>;

  bundleMenu: Array<{
    menuGroupName:       string,
    menu:                Array<{
      name: string, description: string, price: number, checked: boolean, discount: number, percent: number
    }>
  }>;

  bundleItem: {
    bundleName:            string,
    bundleDescription:     string,
    live:                  boolean,
    total:                 number,
    totalDiscount:         number,
    totalPercent:          number,
    bundleElem:            Array<{
      menuGroupName:       string,
      menu:                Array<{
        name: string, description: string, price: number, checked: boolean, discount: number, percent: number
      }>
    }>
  };

  bundleName:                   string;
  bundleDescription:            string;

  totalDiscountPrice:           number;
  totalDiscountPercent:         number;
  totalPrice:                   number;

  constructor(
    private formBuilder: FormBuilder,
    public params: NavParams,
    public viewCtrl: ViewController,
    public storage: Storage,
    public events: Events,
    public navCtrl: NavController
  ) {

    this.coupDesc = this.formBuilder.group({
      bundleName: ['', Validators.required],
      bundleDescription: ['', Validators.required],
    });

    this.totalDiscountPrice    = 0;
    this.totalDiscountPercent  = 0;
    this.totalPrice            = 0;

    // Menu is assigned from the input parameter data
    this.menuGroup = this.params.data;
    this.bundleMenu = [];

    // Dummy variable to hold bundle
    this.bundleItem = {
      bundleName:            "",
      bundleDescription:     "",
      live:                  false,
      total:                 0,
      totalDiscount:         0,
      totalPercent:          0,
      bundleElem: []
    };

    // Loop through menu and init dummy bundle
    for (var i = 0; i < this.menuGroup.length; i++ ){

      var menuItem = {
        menuGroupName:  "",
        menu: []
      }

      menuItem.menuGroupName =  this.menuGroup[i].menuGroupName;
      this.bundleMenu.push(menuItem);

      for (var j = 0; j < this.menuGroup[i].menu.length; j++ ){
        var item = {
          name: this.menuGroup[i].menu[j].name,
          description: this.menuGroup[i].menu[j].description,
          price: this.menuGroup[i].menu[j].price,
          checked: false,
          discount: 0,
          percent: 0
        };
        this.bundleMenu[i].menu.push(item);
      };
    };

  };

  // Close bundle page
  dismiss() {
    this.viewCtrl.dismiss();
  };

  // Add item to bundle
  addToBundle(group, index){
    this.bundleMenu[group].menu[index].checked = !this.bundleMenu[group].menu[index].checked;
  };

  sumTotal(){
    var sum = 0;
    this.bundleMenu.forEach((group, groupIndex) => {
      group.menu.forEach((item, itemIndex) => {
        if(item.checked == true){
          sum += Number(item.price);
        } else {
          item.discount = 0;
          item.percent = 0;
        };
      });
    });
    this.totalPrice = sum;
    this.sumTotals();
  }

  sumTotalPrice(i,j){
    this.bundleMenu[i].menu[j].percent = Math.floor(100 - ((this.bundleMenu[i].menu[j].discount / this.bundleMenu[i].menu[j].price) * 100));
    this.sumTotals()
  }

  sumTotalPercent(i,j){
    this.bundleMenu[i].menu[j].discount = Math.round(this.bundleMenu[i].menu[j].price * ((100 - this.bundleMenu[i].menu[j].percent) / 100) * 100) / 100;
    this.sumTotals();
  }

  sumTotals(){
    var sumDiscount = 0;
    this.bundleMenu.forEach((group, groupIndex) => {
      group.menu.forEach((item, itemIndex) => {
        if(item.checked == true){
          sumDiscount += Number(item.discount);
        };
      });
    });
    this.totalDiscountPrice = sumDiscount;

    var percent = Math.floor(100 - (100 * this.totalDiscountPrice / this.totalPrice));
    this.totalDiscountPercent = ( percent > 0) ? percent : 0;
  }

  // Save bundle to storage and push to firebase
  saveBundle() {


  this.readyToSubmit = true;

  if(!this.coupDesc.valid){

  } else {

    this.bundleItem.bundleName = this.coupDesc.value.bundleName;
    this.bundleItem.bundleDescription = this.coupDesc.value.bundleDescription;

    this.bundleItem.total = this.totalPrice;
    this.bundleItem.totalDiscount = this.totalDiscountPrice;
    this.bundleItem.totalPercent = this.totalDiscountPercent;

    this.bundleMenu.forEach((group, groupIndex) => {
      var groupE = {menuGroupName: group.menuGroupName, menu: []};
      group.menu.forEach((item, itemIndex) =>{
        if(item.checked == true){

          var itemE = {
            name: item.name,
            description: item.description,
            price: item.price,
            checked: item.checked,
            discount: item.discount,
            percent: item.percent
          };

          groupE.menu.push(itemE);

        };
      });

      if(groupE.menu.length != 0){
        this.bundleItem.bundleElem.push(groupE);
      };
    });

    // reference to firebase database and current user
    var ref = firebase.database().ref("/Bundles");
    var user = firebase.auth().currentUser;

    ref.child(user.uid).update({
      [this.bundleItem.bundleName] : {
        bundleName: this.bundleItem.bundleName,
        bundleDescription : this.bundleItem.bundleDescription,
        live: this.bundleItem.live,
        total: this.bundleItem.total,
        totalDiscount: this.bundleItem.totalDiscount,
        totalPercent: this.bundleItem.totalPercent,
        bundleElem : this.bundleItem.bundleElem
      }
    });

    this.dismiss();

  }


  };


};
