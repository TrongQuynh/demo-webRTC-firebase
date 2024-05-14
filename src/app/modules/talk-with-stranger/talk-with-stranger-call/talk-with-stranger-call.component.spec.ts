import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TalkWithStrangerCallComponent } from './talk-with-stranger-call.component';

describe('TalkWithStrangerCallComponent', () => {
  let component: TalkWithStrangerCallComponent;
  let fixture: ComponentFixture<TalkWithStrangerCallComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TalkWithStrangerCallComponent]
    });
    fixture = TestBed.createComponent(TalkWithStrangerCallComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
