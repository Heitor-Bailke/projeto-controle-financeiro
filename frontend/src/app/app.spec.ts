import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { RouterTestingHarness } from '@angular/router/testing';
import { App } from './app';
import { LoginPageComponent } from './pages/login-page/login-page';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideRouter([{ path: '', component: LoginPageComponent }])]
    }).compileComponents();
  });

  it('creates the app', () => {
    expect(TestBed.createComponent(App).componentInstance).toBeTruthy();
  });

  it('opens the login page and switches to registration', async () => {
    const harness = await RouterTestingHarness.create('/');
    expect(harness.routeNativeElement?.querySelector('h2')?.textContent).toBe('Acesse sua conta');
    harness.routeNativeElement?.querySelector<HTMLButtonElement>('.switch-form')?.click();
    harness.detectChanges();
    expect(harness.routeNativeElement?.querySelector('h2')?.textContent).toBe('Crie sua conta');
    expect(harness.routeNativeElement?.querySelector('input[autocomplete="new-password"]')).toBeTruthy();
  });
});
