import { Component } from '@angular/core';
import { NavController, Events, ToastController, LoadingController } from 'ionic-angular';
import { TabsPage } from '../tabs/tabs';
import firebase from 'firebase';

@Component({
  selector: 'page-signup',
  templateUrl: 'signup.html',
})
export class SignupPage {

  username : string;
  email : string;
  password : string;
  fbAuthID : string;

  constructor(
    public navCtrl: NavController,
    public events: Events,
    public loadingCtrl: LoadingController,
    public toastCtrl: ToastController) {

  }

  signUpClicked(){

    if(this.email === undefined || this.password === undefined || this.username === undefined){
      this.errToast("Please enter valid username, email and password");
    } else {

      var auth = firebase.auth();
      var userRef = firebase.database().ref("/User Profiles");

      auth.createUserWithEmailAndPassword(this.email, this.password).then((user) => {
        // if user created, then update the user displayName
        var currentUser = auth.currentUser;
        this.fbAuthID = currentUser.uid;

        userRef.child(this.fbAuthID).update({
          email: this.email,
          pass: this.password,
          displayName: this.username
        });

        user.updateProfile({
          displayName: this.username
        });

        this.events.publish('user:loggedIn', true, this.username);
        this.presentLoading();

      //Handle Error
      }, (error) => {
          this.errToast(error.message);
      });

    }

  }

  errToast(msg){
    let toast = this.toastCtrl.create({
      message: msg,
      duration: 3000,
      position: 'bottom'
    });

    toast.present();
  }

  presentLoading() {
    let loader = this.loadingCtrl.create({
      content: "Signup successful! You are being logged in now please wait...",
    });
    loader.present();

    setTimeout(() => {
      this.navCtrl.setRoot(TabsPage);
    }, 2000);

    setTimeout(() => {
      loader.dismiss();
    }, 4000);

  }


}