import type { AccountType } from '@workarmy/types';
import type { LabelKey } from './labels';
import type { IconName } from './components/Icon';

/** Drives the homepage "I am a…" selector. `app` decides where Register routes. */
export interface ParticipantOption {
  accountType: AccountType;
  app: 'users' | 'providers';
  titleKey: LabelKey;
  descKey: LabelKey;
  icon: IconName;
}

export const PARTICIPANTS: ParticipantOption[] = [
  {
    accountType: 'JOB_SEEKER',
    app: 'users',
    titleKey: 'participant.jobSeeker.title',
    descKey: 'participant.jobSeeker.desc',
    icon: 'user',
  },
  {
    accountType: 'EMPLOYER',
    app: 'providers',
    titleKey: 'participant.employer.title',
    descKey: 'participant.employer.desc',
    icon: 'building',
  },
  {
    accountType: 'FARM',
    app: 'providers',
    titleKey: 'participant.farm.title',
    descKey: 'participant.farm.desc',
    icon: 'sprout',
  },
  {
    accountType: 'CONTRACTOR',
    app: 'providers',
    titleKey: 'participant.contractor.title',
    descKey: 'participant.contractor.desc',
    icon: 'hardhat',
  },
  {
    accountType: 'LABOUR_HIRE',
    app: 'providers',
    titleKey: 'participant.labourHire.title',
    descKey: 'participant.labourHire.desc',
    icon: 'users',
  },
  {
    accountType: 'RECRUITMENT_AGENCY',
    app: 'providers',
    titleKey: 'participant.recruitment.title',
    descKey: 'participant.recruitment.desc',
    icon: 'search',
  },
];
