import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TalkWithStrangerComponent } from './modules/talk-with-stranger/talk-with-stranger/talk-with-stranger.component';
import { TalkWithStrangerCallComponent } from './modules/talk-with-stranger/talk-with-stranger-call/talk-with-stranger-call.component';
import { TalkWithStrangerStartComponent } from './modules/talk-with-stranger/talk-with-stranger-start/talk-with-stranger-start.component';

const routes: Routes = [
  {
    path: 'call/:key',
    component: TalkWithStrangerCallComponent,
    pathMatch: "full"
  },
  {
    path: 'waitting',
    component: TalkWithStrangerComponent
  },
  {
    path: '',
    component: TalkWithStrangerStartComponent,
    pathMatch: "full"
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
