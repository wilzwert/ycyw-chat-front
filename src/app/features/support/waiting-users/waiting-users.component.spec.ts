import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaitingUsersComponent } from './waiting-users.component';

describe('WaitingUsersComponent', () => {
  let component: WaitingUsersComponent;
  let fixture: ComponentFixture<WaitingUsersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WaitingUsersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WaitingUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
