import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MenuComponent } from './menu.component';
import { SessionService } from '../../core/services/session.service';
import { of } from 'rxjs';
import { provideRouter, RouterLink } from '@angular/router';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

describe('MenuComponent', () => {
  let component: MenuComponent;
  let fixture: ComponentFixture<MenuComponent>;
  let sessionServiceMock: jest.Mocked<SessionService>;

  beforeEach(async () => {
    sessionServiceMock = {
      $isLogged: jest.fn().mockReturnValue(of(true))
    } as unknown as jest.Mocked<SessionService>;

    await TestBed.configureTestingModule({
      imports: [
        MenuComponent,
        MatIconModule
      ],
      providers: [
        provideRouter([]),
        { provide: SessionService, useValue: sessionServiceMock},
        {
          provide: MatIconRegistry,
          useValue: {
            addSvgIcon: jest.fn(),
            getNamedSvgIcon: jest.fn().mockReturnValue(of('<svg></svg>')),
          },
        },
        {
          provide: DomSanitizer,
          useValue: {
            bypassSecurityTrustResourceUrl: jest.fn(),
          },
        },
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
