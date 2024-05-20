import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TalkWithStrangerComponent } from './modules/talk-with-stranger/talk-with-stranger/talk-with-stranger.component';
import { TalkWithStrangerCallComponent } from './modules/talk-with-stranger/talk-with-stranger-call/talk-with-stranger-call.component';
import { TalkWithStrangerStartComponent } from './modules/talk-with-stranger/talk-with-stranger-start/talk-with-stranger-start.component';
import { P2pGroupStartComponent } from './modules/shared/p2p-group/p2p-group-start/p2p-group-start.component';
import { P2pGroupCallComponent } from './modules/shared/p2p-group/p2p-group-call/p2p-group-call.component';

const routes: Routes = [
  {
    path: 'group/start',
    component: P2pGroupStartComponent,
    pathMatch: "full"
  },
  {
    path: 'group-call/:key',
    component: P2pGroupCallComponent,
    pathMatch: "full"
  },
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
