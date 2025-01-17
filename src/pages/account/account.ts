import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

import { User }             from '../../providers/user';
import { FcmNotifications } from '../../providers/fcm-notifications';

@Component({
  selector: 'page-account',
  templateUrl: 'account.html',
})
export class AccountPage {

  email:    string;
  password: string;
  userName: string;
  token:    any;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public userService: User,
    public fcm: FcmNotifications
  ) {

    this.email    = this.userService.user.email;
    this.userName = this.userService.user.username;
    this.password = "";
    this.token    = this.fcm.token;

  };

  accountInfoUpdate(){
    let ref =  firebase.database().ref("/User Profiles");
    let user = firebase.auth().currentUser;
    let uid = user.uid;

    try{
      ref.child(uid).update({
        displayName: this.userName,
        email: this.email,
      });
    }catch(error){
      ref.child(uid).update({
        displayName: user.displayName,
        email: user.email
      });
    }
  };


};
