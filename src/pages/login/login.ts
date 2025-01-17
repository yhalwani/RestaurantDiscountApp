import { Component }            from '@angular/core';
import { NavController, Events, LoadingController, ToastController } from 'ionic-angular';
import { SettingsProvider } from './../../providers/settings/settings';
import { TabsPage }             from '../tabs/tabs';
import { RestaurantPortalPage } from '../restaurant-portal/restaurant-portal';

import { User }                 from '../../providers/user';
import { FcmNotifications }     from '../../providers/fcm-notifications';
import { Platform } from 'ionic-angular';
import { Intercom } from '@ionic-native/intercom';

import firebase from 'firebase';

declare var window;
declare var intercom;

@Component({
  selector: 'page-login',
  templateUrl: 'login.html',
})
export class LoginPage {

  selectedTheme : String;
  email :     string;
  password :  string;
  userType:   string;
  userToggle: boolean;


  constructor(
    public navCtrl: NavController,
    public events: Events,
    public loadingCtrl: LoadingController,
    public toastCtrl: ToastController,
    private settings: SettingsProvider,
    public userService: User,
    public fcm: FcmNotifications,
    public plt: Platform,
    private intercom: Intercom
  ) {
      this.userType = "User";
      this.userToggle = false;
      this.settings.getActiveTheme().subscribe(val => this.selectedTheme = val);
    }

    loginClicked() {

      if(this.email === undefined || this.password === undefined){
        this.errToast("Please enter valid email and password");
      } else {
        var auth = firebase.auth();
        auth.signInWithEmailAndPassword(this.email, this.password).then(() => {
          let tmp;
          // check if the user trying to log in exists in Restaurant Profiles node in the database
          // return true if exists, else false.
          firebase.database().ref('Restaurant Profiles').once('value', (snapshot) => {
            tmp = snapshot.hasChild(firebase.auth().currentUser.uid)
          })

          // if usertype is restaurant but node !exists in Restaurant Profiles child node -> throw error
          if(this.userType != "User" && tmp == false)
          {
            this.errToast("PERMISSION_DENIED. Must be signed up as a restaurant to be able to use this feature")
          }
          // if user and does not exists in Restauarant Profiles child node -> login as user
          else if(this.userType == "User")
          {
            this.events.publish('user:loggedIn', true, auth.currentUser.displayName);
            this.userService.user = {email: this.email, username: auth.currentUser.displayName, loggedIn: true, fcmToken: this.fcm.token};
            this.presentLoading(this.userToggle);
          }
          // if usertype is restaurant and exists in Restauarant Profiles child node -> login as restaurant
          else if(this.userType != "User" && tmp == true)
          {
            this.events.publish('restaurant:loggedIn', true, auth.currentUser.displayName);
            this.presentLoading(this.userToggle);

            if (this.plt.is('cordova')) {
              intercom.setLauncherVisibility('VISIBLE');
              intercom.registerIdentifiedUser({
                userId: auth.currentUser.uid
              });
            } else {
            window.Intercom("boot", {
              app_id: "ns2pj54u",
              user_id: auth.currentUser.uid,
              hide_default_launcher: false
            });
          }

            //
            if (this.selectedTheme === 'user-theme') {
              this.settings.setActiveTheme('restaurant-theme');
            } else {
              this.settings.setActiveTheme('user-theme');
            }

          }
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

    presentLoading(type) {
      let loader = this.loadingCtrl.create({
        content: "Login successful! Please wait...",
      });
      loader.present();

      setTimeout(() => {
        if( type == false ){
          this.navCtrl.setRoot(TabsPage);
        } else {
          this.navCtrl.setRoot(RestaurantPortalPage);
        }
      }, 2000);

      setTimeout(() => {
        loader.dismiss();
      }, 4000);

    };

    userToggled(){
      this.userType = this.userToggle ? "Restaurant" : "User";
    };

  }
