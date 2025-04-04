import { Component, OnInit } from '@angular/core';
import { BreadcrumbComponent } from '../../components/breadcrumb.component';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [BreadcrumbComponent, FormsModule],
  styles: [`
    .action-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .profile-input {
      padding: 1rem;
      border-radius: 8px;
      border: 1px solid #ccc;
      font-size: 1.1em;
      width: 100%;
      max-width: 400px;
      background: #f8f8f8;
      transition: all 0.2s ease;
    }


  `],
  template: `
    <section class="hero">
      <app-breadcrumb [items]="[{ label: 'Home', url: '' }]"></app-breadcrumb>

      <div class="hero-wrapper">
        <div class="hero-content">
          <h1>Welcome to Angor Profile</h1>
          <p class="hero-description">
            Angor Profile is a Nostr profile editor, built specifically to manage the 
            profile information for Angor projects.
          </p>
          <div class="action-container">
            <input 
              [(ngModel)]="profileId" 
              placeholder="npub..." 
              (keyup.enter)="openProfile()"
              class="profile-input"
            >
            <button 
              (click)="openProfile()" 
              class="cta-button profile-button"
              [disabled]="!isValidNpub()"
            >
              Open Profile
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- <div class="features">
      <div class="feature-card">
        <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
        </svg>
        <h2>Discover Projects</h2>
        <p>Find innovative Bitcoin projects that align with your interests and investment goals.</p>
      </div>
      <div class="feature-card">
        <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2>Invest Securely</h2>
        <p>Invest in projects with confidence using our secure and transparent platform.</p>
      </div>
      <div class="feature-card">
        <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h2>Track Progress</h2>
        <p>Monitor your investments and stay updated on project developments.</p>
      </div>
    </div> -->
  `
})
export class HomeComponent implements OnInit {
  profileId: string = '';
  private readonly STORAGE_KEY = 'angor-profile-id';

  constructor(private router: Router) {}

  ngOnInit() {
    const savedProfileId = localStorage.getItem(this.STORAGE_KEY);
    if (savedProfileId) {
      this.profileId = savedProfileId;
    }
  }

  openProfile() {
    if (this.profileId && this.isValidNpub()) {
      localStorage.setItem(this.STORAGE_KEY, this.profileId);
      this.router.navigate(['/profile', this.profileId]);
    }
  }

  isValidNpub(): boolean {
    return this.profileId.toLowerCase().startsWith('npub');
  }
}
