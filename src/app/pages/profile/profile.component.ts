import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../components/breadcrumb.component';
import { FaqItem, RelayService } from '../../services/relay.service';
import { SigningDialogComponent } from '../../components/signing-dialog.component';
import NDK, {
  calculateRelaySetFromEvent,
  NDKEvent,
  NDKNip07Signer,
  NDKPrivateKeySigner,
  NDKUser,
} from '@nostr-dev-kit/ndk';

export interface NostrProfile {
  name: string;
  displayName: string;
  about: string;
  picture: string;
  banner: string;
  nip05: string;
  lud16: string;
  website: string;
}

interface ProjectContent {
  content: string;
  lastUpdated?: number;
}

interface ProjectMembers {
  pubkeys: string[];
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    BreadcrumbComponent,
    FormsModule,
    SigningDialogComponent,
  ],
  template: `
    <section class="hero">
      <app-breadcrumb
        [items]="[
          { label: 'Home', url: '/' },
          { label: 'Profile', url: '' }
        ]"
      ></app-breadcrumb>
      <div class="hero-wrapper">
        <div class="hero-content">
          <h1>Profile Settings</h1>
          <p class="hero-description">
            Manage your Nostr profile information that will be displayed on your
            Angor projects.
          </p>
        </div>
      </div>
    </section>

    <div class="container">
      <div class="tabs">
        <button
          *ngFor="let tab of tabs"
          [class.active]="activeTab === tab.id"
          (click)="setActiveTab(tab.id)"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="tab-content" [ngSwitch]="activeTab">
        <div *ngSwitchCase="'profile'" class="profile-section">
          <h2>Basic Information</h2>
          <div class="form-grid">
            <div class="form-group">
              <label for="name">Username</label>
              <input
                id="name"
                type="text"
                [(ngModel)]="profile.name"
                placeholder="Your username"
              />
            </div>

            <div class="form-group">
              <label for="displayName">Display Name</label>
              <input
                id="displayName"
                type="text"
                [(ngModel)]="profile.displayName"
                placeholder="Your display name"
              />
            </div>

            <div class="form-group full-width">
              <label for="about">About</label>
              <textarea
                id="about"
                [(ngModel)]="profile.about"
                placeholder="Tell us about yourself"
                rows="4"
              ></textarea>
            </div>

            <div class="form-group">
              <label for="picture">Profile Picture URL</label>
              <input
                id="picture"
                type="url"
                [(ngModel)]="profile.picture"
                placeholder="https://example.com/picture.jpg"
              />
            </div>

            <div class="form-group">
              <label for="banner">Banner Image URL</label>
              <input
                id="banner"
                type="url"
                [(ngModel)]="profile.banner"
                placeholder="https://example.com/banner.jpg"
              />
            </div>

            <div class="form-group">
              <label for="nip05">NIP-05 Verification</label>
              <input
                id="nip05"
                type="text"
                [(ngModel)]="profile.nip05"
                placeholder="you@example.com"
              />
            </div>

            <div class="form-group">
              <label for="lud16">Lightning Address</label>
              <input
                id="lud16"
                type="text"
                [(ngModel)]="profile.lud16"
                placeholder="your@lightning.address"
              />
            </div>

            <div class="form-group">
              <label for="website">Website</label>
              <input
                id="website"
                type="url"
                [(ngModel)]="profile.website"
                placeholder="https://your-website.com"
              />
            </div>
          </div>
        </div>

        <div *ngSwitchCase="'project'" class="profile-section">
          <h2>Project Description</h2>
          <p class="helper-text">
            Write a detailed description of your project. This will be displayed
            as your main project content.
          </p>

          <div class="editor-container">
            <div class="editor-toolbar">
              <button
                class="tool-button"
                (click)="formatText('**', '**')"
                title="Bold"
              >
                B
              </button>
              <button
                class="tool-button"
                (click)="formatText('*', '*')"
                title="Italic"
              >
                I
              </button>
              <button
                class="tool-button"
                (click)="formatText('### ', '')"
                title="Heading"
              >
                H
              </button>
              <button
                class="tool-button"
                (click)="formatText('- ', '')"
                title="List Item"
              >
                •
              </button>
              <button
                class="tool-button"
                (click)="formatText('[', '](url)')"
                title="Link"
              >
                🔗
              </button>
            </div>

            <div class="textarea-wrapper">
              <textarea
                [(ngModel)]="projectContent.content"
                placeholder="Write your project description here... Use Markdown for formatting."
                rows="20"
                (input)="onContentChange()"
              ></textarea>

              <div *ngIf="projectContent.lastUpdated" class="last-updated">
                Last updated: {{ formatDate(projectContent.lastUpdated) }}
              </div>
            </div>

            <div class="preview-toggle">
              <button (click)="togglePreview()" class="secondary-button">
                {{ showPreview ? 'Edit' : 'Preview' }}
              </button>
            </div>

            <div *ngIf="showPreview" class="markdown-preview">
              <!-- TODO: Add markdown preview rendering -->
              <pre>{{ projectContent.content }}</pre>
            </div>
          </div>
        </div>

        <div *ngSwitchCase="'faq'" class="profile-section">
          <h2>Frequently Asked Questions</h2>
          <p class="helper-text">
            Add questions and answers that will help users understand your
            project better.
          </p>

          <div class="faq-container">
            <div
              *ngFor="let faq of faqItems; trackBy: trackById"
              class="faq-item"
            >
              <div class="faq-header">
                <button
                  class="delete-button"
                  (click)="deleteFaqItem(faq.id)"
                  title="Delete question"
                >
                  ×
                </button>
              </div>
              <div class="form-group">
                <label>Question</label>
                <input
                  type="text"
                  [(ngModel)]="faq.question"
                  placeholder="Enter your question"
                />
              </div>
              <div class="form-group">
                <label>Answer</label>
                <textarea
                  [(ngModel)]="faq.answer"
                  rows="4"
                  placeholder="Enter your answer"
                ></textarea>
              </div>
            </div>

            <button class="add-faq-button" (click)="addFaqItem()">
              + Add New Question
            </button>
          </div>
        </div>

        <div *ngSwitchCase="'members'" class="profile-section">
          <h2>Team Members</h2>
          <p class="helper-text">
            Add Nostr public keys of team members who can manage this project.
          </p>

          <div class="members-container">
            <div
              *ngFor="
                let pubkey of members.pubkeys;
                let i = index;
                trackBy: trackByIndex
              "
              class="member-item"
            >
              <input
                type="text"
                [(ngModel)]="members.pubkeys[i]"
                placeholder="npub..."
                class="member-input"
              />
              <button class="delete-button" (click)="removeMember(i)">×</button>
            </div>

            <button class="add-member-button" (click)="addMember()">
              + Add Team Member
            </button>
          </div>
        </div>
      </div>

      <div class="actions">
        <button class="secondary-button" (click)="resetChanges()">
          Reset Changes
        </button>
        <button class="primary-button" (click)="saveProfile()">
          Save Profile
        </button>
      </div>
    </div>

    <app-signing-dialog
      [visible]="showSigningDialog"
      [dataToSign]="dataToSign"
      (sign)="handleSigning($event)"
    ></app-signing-dialog>
  `,
  styles: [
    `
      .tabs {
        display: flex;
        gap: 1rem;
        margin: 2rem;
        border-bottom: 1px solid var(--border);
        padding-bottom: 0;
      }

      .tabs button {
        background: none;
        border: none;
        padding: 0.75rem 1.5rem;
        cursor: pointer;
        color: var(--text);
        font-size: 1rem;
        position: relative;
        transition: all 0.3s ease;
        opacity: 0.7;
      }

      .tabs button:hover {
        opacity: 1;
        background: var(--surface-hover);
      }

      .tabs button.active {
        color: var(--accent);
        opacity: 1;
      }

      .tabs button.active::after {
        content: '';
        position: absolute;
        bottom: -1px;
        left: 0;
        right: 0;
        height: 2px;
        background: var(--accent);
      }

      .profile-section {
        background: var(--surface-card);
        padding: 2rem;
        border-radius: 8px;
        margin: 2rem;
      }

      .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.5rem;
        margin-top: 1.5rem;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .form-group.full-width {
        grid-column: 1 / -1;
      }

      label {
        font-weight: 500;
        color: var(--text);
      }

      input,
      textarea {
        padding: 0.75rem;
        border: 1px solid var(--border);
        border-radius: 4px;
        background: var(--surface-ground);
        color: var(--text);
        font-size: 1rem;
      }

      input:focus,
      textarea:focus {
        outline: none;
        border-color: var(--accent);
      }

      .actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin: 2rem;
      }

      .primary-button,
      .secondary-button {
        padding: 0.75rem 1.5rem;
        border-radius: 4px;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .primary-button {
        background: var(--accent);
        color: white;
        border: none;
      }

      .secondary-button {
        background: var(--surface-card);
        color: var(--text);
        border: 1px solid var(--border);
      }

      .primary-button:hover,
      .secondary-button:hover {
        transform: translateY(-1px);
      }

      .editor-container {
        margin-top: 1.5rem;
      }

      .editor-toolbar {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1rem;
        padding: 0.5rem;
        background: var(--surface-ground);
        border: 1px solid var(--border);
        border-radius: 4px;
      }

      .tool-button {
        padding: 0.5rem 1rem;
        background: var(--surface-card);
        border: 1px solid var(--border);
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.2s ease;
      }

      .tool-button:hover {
        background: var(--surface-hover);
      }

      .textarea-wrapper {
        position: relative;
      }

      textarea {
        width: 100%;
        min-height: 400px;
        padding: 1rem;
        font-family: monospace;
        line-height: 1.6;
        resize: vertical;
      }

      .last-updated {
        position: absolute;
        bottom: 0.5rem;
        right: 0.5rem;
        font-size: 0.8rem;
        color: var(--text-secondary);
        background: var(--surface-ground);
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
      }

      .preview-toggle {
        margin: 1rem 0;
        text-align: right;
      }

      .markdown-preview {
        padding: 1rem;
        background: var(--surface-ground);
        border: 1px solid var(--border);
        border-radius: 4px;
        min-height: 400px;
      }

      .helper-text {
        color: var(--text-secondary);
        margin-bottom: 1rem;
      }

      .faq-container {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        margin-top: 1.5rem;
      }

      .faq-item {
        background: var(--surface-ground);
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 1.5rem;
        position: relative;
      }

      .faq-header {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 1rem;
      }

      .delete-button {
        background: none;
        border: none;
        color: var(--text-secondary);
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0.25rem 0.5rem;
        line-height: 1;
        border-radius: 4px;
        transition: all 0.2s ease;
      }

      .delete-button:hover {
        background: var(--surface-hover);
        color: var(--accent);
      }

      .add-faq-button {
        background: var(--surface-card);
        border: 2px dashed var(--border);
        color: var(--text);
        padding: 1rem;
        border-radius: 8px;
        cursor: pointer;
        font-size: 1rem;
        transition: all 0.2s ease;
        width: 100%;
      }

      .add-faq-button:hover {
        background: var(--surface-hover);
        border-color: var(--accent);
        color: var(--accent);
      }

      .members-container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin-top: 1.5rem;
      }

      .member-item {
        display: flex;
        gap: 0.5rem;
        align-items: center;
      }

      .member-input {
        flex: 1;
      }

      .add-member-button {
        background: var(--surface-card);
        border: 2px dashed var(--border);
        color: var(--text);
        padding: 1rem;
        border-radius: 8px;
        cursor: pointer;
        font-size: 1rem;
        transition: all 0.2s ease;
        width: 100%;
        margin-top: 1rem;
      }

      .add-member-button:hover {
        background: var(--surface-hover);
        border-color: var(--accent);
        color: var(--accent);
      }
    `,
  ],
})
export class ProfileComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private relayService = inject(RelayService);

  pubkey!: string;
  npub!: string;
  loading = true;

  tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'project', label: 'Project' },
    { id: 'faq', label: 'FAQ' },
    { id: 'members', label: 'Members' },
  ];

  activeTab = 'profile';

  profile: NostrProfile = {
    name: '',
    displayName: '',
    about: '',
    picture: '',
    banner: '',
    nip05: '',
    lud16: '',
    website: '',
  };

  projectContent: ProjectContent = {
    content: '',
    lastUpdated: undefined,
  };

  faqItems: FaqItem[] = [];

  members: ProjectMembers = {
    pubkeys: [],
  };

  showPreview = false;
  showSigningDialog = false;
  dataToSign: any = null;
  user: NDKUser | null = null;

  constructor() {
    // Initialize with empty states
    this.addFaqItem();
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const pubkey = params.get('pubkey');
      if (pubkey) {
        if (pubkey.startsWith('npub')) {
          this.user = new NDKUser({
            npub: pubkey,
            relayUrls: this.relayService.relayUrls,
          });
        } else {
          this.user = new NDKUser({
            pubkey: pubkey,
            relayUrls: this.relayService.relayUrls,
          });
        }

        this.npub = this.user.npub;
        this.pubkey = this.user.pubkey;

        this.loadProfileData(this.pubkey);
      }
    });
  }

  async loadProfileData(pubkey: string) {
    this.loading = true;
    try {
      const profileData = await this.relayService.loadProfileMetadata(pubkey);
      if (profileData) {
        console.log('Loaded profile:', profileData);
        this.profile = {
          name: profileData.name || '',
          displayName: profileData.displayName || '',
          about: profileData.about || '',
          picture: profileData.picture || '',
          banner: profileData.banner || '',
          nip05: profileData.nip05 || '',
          lud16: profileData.lud16 || '',
          website: profileData.website || '',
        };
      }

      const projectData = await this.relayService.loadProjectContent(pubkey);
      if (projectData) {
        this.projectContent = {
          content: projectData.content || '',
          lastUpdated: projectData.created_at,
        };
      }

      const faqData = await this.relayService.loadFaqContent(pubkey);
      if (faqData && Array.isArray(faqData)) {
        this.faqItems = faqData;
      }

      const membersData = await this.relayService.loadMembers(pubkey);
      if (membersData) {
        this.members = {
          pubkeys: membersData.pubkeys || [],
        };
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      this.loading = false;
    }
  }

  setActiveTab(tabId: string) {
    this.activeTab = tabId;
  }

  formatText(prefix: string, suffix: string) {
    const textarea = document.querySelector('textarea');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selection = textarea.value.substring(start, end);
    const replacement = prefix + selection + suffix;

    textarea.value =
      textarea.value.substring(0, start) +
      replacement +
      textarea.value.substring(end);

    this.projectContent.content = textarea.value;

    textarea.focus();
    textarea.setSelectionRange(start + prefix.length, end + prefix.length);
  }

  togglePreview() {
    this.showPreview = !this.showPreview;
  }

  onContentChange() {
    this.projectContent.lastUpdated = Date.now();
  }

  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString();
  }

  addFaqItem() {
    this.faqItems.push({
      id: crypto.randomUUID(),
      question: '',
      answer: '',
    });
  }

  deleteFaqItem(id: string) {
    this.faqItems = this.faqItems.filter((item) => item.id !== id);
  }

  async loadMembers() {
    const members = await this.relayService.loadMembers(this.pubkey);
    if (members) {
      this.members = members;
    } else {
      this.members = { pubkeys: [] };
    }
  }

  addMember() {
    this.members.pubkeys.push('');
  }

  removeMember(index: number) {
    this.members.pubkeys.splice(index, 1);
  }

  saveProfile() {
    if (!this.pubkey) return;

    this.dataToSign = {
      profile: this.profile,
      project: this.projectContent,
      faq: this.faqItems,
      members: this.members,
    };

    this.showSigningDialog = true;
  }

  async handleSigning(result: { signed: boolean; key?: string }) {
    this.showSigningDialog = false;

    if (!result.signed) {
      return;
    }

    try {
      await this.relayService.ensureConnected();

      const nip07signer = new NDKNip07Signer();
      this.relayService.ndk!.signer = nip07signer;

      const events = this.relayService.createEventsFromData(
        this.pubkey!,
        this.dataToSign
      );

      if (result.key === 'extension') {
        for (const event of events) {
          const ndkEvent = new NDKEvent(this.relayService.ndk!, event);
          const published = await ndkEvent.publish();
          console.log('PUBLISHED: ', published);
        }
      } else if (result.key) {
        this.relayService.ndk!.signer = new NDKPrivateKeySigner(result.key);

        for (const event of events) {
          const ndkEvent = new NDKEvent(this.relayService.ndk!, event);
          const published = await ndkEvent.publish();
          console.log('PUBLISHED: ', published);
        }
      }

      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    }
  }

  resetChanges() {
    const originalData = this.relayService.getOriginalProfileData(this.pubkey!);
    if (originalData) {
      this.profile = this.relayService.deepClone(originalData);
    }
  }

  trackById(index: number, item: FaqItem) {
    return item.id;
  }
}
