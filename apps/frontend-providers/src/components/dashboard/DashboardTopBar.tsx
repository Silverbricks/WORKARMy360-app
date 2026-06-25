'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { ConversationView, MeResponse, Notification } from '@workarmy/types';
import { Icon, Logo, cn } from '@workarmy/ui';

type Menu = 'messages' | 'notifications' | 'account' | null;

interface DashboardTopBarProps {
  me: MeResponse | null;
  conversations: ConversationView[];
  notifications: Notification[];
  onMarkAllRead: () => void;
  onOpenSidebar: () => void;
  onLogout: () => void;
}

export function DashboardTopBar({
  me,
  conversations,
  notifications,
  onMarkAllRead,
  onOpenSidebar,
  onLogout,
}: DashboardTopBarProps) {
  const org = me?.organisation ?? null;
  const name = org?.name?.trim() || 'Business';
  const initials = name.slice(0, 2).toUpperCase() || 'WA';
  const unreadMessages = conversations.reduce((n, c) => n + c.unread, 0);
  const unreadNotifications = notifications.filter((n) => !n.read).length;

  const [menu, setMenu] = useState<Menu>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setMenu(null);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function toggle(m: Menu) {
    setMenu((cur) => (cur === m ? null : m));
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[#2A2F36] bg-[#1B1F24]">
      <div ref={rootRef} className="flex h-16 items-center gap-2 px-3 sm:px-4">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="grid h-9 w-9 place-items-center rounded-md text-[#CBD5E1] transition hover:bg-white/5 hover:text-white lg:hidden"
          aria-label="Open menu"
        >
          <Icon name="menu" size={20} />
        </button>

        <Link href="/dashboard" aria-label="WorkArmy for Business" className="mr-1">
          <Logo onDark />
        </Link>
        <span className="hidden rounded bg-[color-mix(in_srgb,var(--accent)_25%,#1B1F24)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white sm:inline">
          Business
        </span>

        <Link
          href="/"
          className="hidden rounded-md px-3 py-2 text-sm text-[#CBD5E1] transition hover:bg-white/5 hover:text-white md:inline"
        >
          Visit site ↗
        </Link>

        <div className="ml-auto flex items-center gap-1">
          <Link
            href="/dashboard/find-staff"
            className="hidden h-9 w-9 place-items-center rounded-md text-[#CBD5E1] transition hover:bg-white/5 hover:text-white sm:grid"
            aria-label="Find workers"
          >
            <Icon name="search" size={19} />
          </Link>
          <Link
            href="/dashboard/support?tab=help"
            className="hidden h-9 w-9 place-items-center rounded-md text-[#CBD5E1] transition hover:bg-white/5 hover:text-white sm:grid"
            aria-label="Help & support"
          >
            <Icon name="lifebuoy" size={19} />
          </Link>

          {/* Messages */}
          <div className="relative">
            <TopButton
              label="Messages"
              icon="message"
              count={unreadMessages}
              active={menu === 'messages'}
              onClick={() => toggle('messages')}
            />
            {menu === 'messages' ? (
              <Dropdown
                title="Messages"
                footerHref="/dashboard/support?tab=messages"
                footerLabel="View all messages"
                onClose={() => setMenu(null)}
              >
                {conversations.length === 0 ? (
                  <Empty>No messages yet.</Empty>
                ) : (
                  conversations.slice(0, 6).map((c) => (
                    <Link
                      key={c.id}
                      href="/dashboard/support?tab=messages"
                      onClick={() => setMenu(null)}
                      className="block px-4 py-2.5 hover:bg-[#F8FAFC]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium text-[#1E293B]">
                          {c.counterparty.name}
                        </span>
                        {c.unread > 0 ? (
                          <span
                            className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white"
                            style={{ backgroundColor: 'var(--accent)' }}
                          >
                            {c.unread}
                          </span>
                        ) : null}
                      </div>
                      <p className="truncate text-xs text-[#64748B]">{c.lastMessage ?? 'No messages'}</p>
                    </Link>
                  ))
                )}
              </Dropdown>
            ) : null}
          </div>

          {/* Notifications */}
          <div className="relative">
            <TopButton
              label="Notifications"
              icon="bell"
              count={unreadNotifications}
              active={menu === 'notifications'}
              onClick={() => toggle('notifications')}
            />
            {menu === 'notifications' ? (
              <Dropdown
                title="Notifications"
                action={
                  unreadNotifications > 0 ? { label: 'Mark all read', onClick: onMarkAllRead } : undefined
                }
                footerHref="/dashboard/support?tab=notifications"
                footerLabel="View all"
                onClose={() => setMenu(null)}
              >
                {notifications.length === 0 ? (
                  <Empty>You&apos;re all caught up.</Empty>
                ) : (
                  notifications.slice(0, 6).map((n) => (
                    <div
                      key={n.id}
                      className={cn('px-4 py-2.5', !n.read && 'bg-[color-mix(in_srgb,var(--accent)_7%,white)]')}
                    >
                      <p className="text-sm font-medium text-[#1E293B]">{n.title}</p>
                      {n.body ? <p className="mt-0.5 text-xs text-[#64748B]">{n.body}</p> : null}
                    </div>
                  ))
                )}
              </Dropdown>
            ) : null}
          </div>

          {/* Account */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggle('account')}
              className={cn(
                'flex items-center gap-2 rounded-md py-1 pl-1 pr-2 transition hover:bg-white/5',
                menu === 'account' && 'bg-white/5',
              )}
            >
              <span
                className="grid h-8 w-8 place-items-center rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                {initials}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block max-w-[140px] truncate text-xs font-medium leading-tight text-white">
                  {name}
                </span>
                <span className="block font-mono text-[10px] leading-tight text-[#94A3B8]">
                  {org?.waId ?? '—'}
                </span>
              </span>
              <Icon name="chevronDown" size={16} className="text-[#CBD5E1]" />
            </button>
            {menu === 'account' ? (
              <Dropdown onClose={() => setMenu(null)}>
                <div className="border-b border-[#E5E7EB] px-4 py-3">
                  <p className="truncate text-sm font-semibold text-[#1E293B]">{name}</p>
                  <p className="font-mono text-xs text-[#64748B]">{org?.waId ?? '—'}</p>
                </div>
                <MenuLink href="/dashboard/profile" icon="building" onClick={() => setMenu(null)}>
                  Business profile
                </MenuLink>
                <MenuLink href="/dashboard/compliance" icon="shield" onClick={() => setMenu(null)}>
                  Compliance
                </MenuLink>
                <MenuLink href="/dashboard/membership" icon="star" onClick={() => setMenu(null)}>
                  Membership &amp; billing
                </MenuLink>
                <MenuLink href="/dashboard/billing" icon="wallet" onClick={() => setMenu(null)}>
                  Accounts &amp; billing
                </MenuLink>
                <MenuLink href="/dashboard/team-admins" icon="users" onClick={() => setMenu(null)}>
                  Team &amp; admins
                </MenuLink>
                <MenuLink href="/dashboard/support?tab=settings" icon="settings" onClick={() => setMenu(null)}>
                  Settings
                </MenuLink>
                <button
                  type="button"
                  onClick={() => {
                    setMenu(null);
                    onLogout();
                  }}
                  className="flex w-full items-center gap-2.5 border-t border-[#E5E7EB] px-4 py-2.5 text-sm text-[#1E293B] transition hover:bg-[#F8FAFC]"
                >
                  <Icon name="logout" size={16} className="text-[#64748B]" />
                  Log out
                </button>
              </Dropdown>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

function TopButton({
  label,
  icon,
  count,
  active,
  onClick,
}: {
  label: string;
  icon: 'message' | 'bell';
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        'relative grid h-9 w-9 place-items-center rounded-md text-[#CBD5E1] transition hover:bg-white/5 hover:text-white',
        active && 'bg-white/5 text-white',
      )}
    >
      <Icon name={icon} size={19} />
      {count > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 grid min-w-[16px] place-items-center rounded-full bg-[#DC2626] px-1 text-[9px] font-bold leading-[16px] text-white">
          {count > 9 ? '9+' : count}
        </span>
      ) : null}
    </button>
  );
}

function Dropdown({
  title,
  action,
  footerHref,
  footerLabel,
  onClose,
  children,
}: {
  title?: string;
  action?: { label: string; onClick: () => void };
  footerHref?: string;
  footerLabel?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-lg">
      {title ? (
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4 py-2.5">
          <p className="text-sm font-semibold text-[#1E293B]">{title}</p>
          {action ? (
            <button
              type="button"
              onClick={action.onClick}
              className="text-xs font-medium"
              style={{ color: 'var(--accent)' }}
            >
              {action.label}
            </button>
          ) : null}
        </div>
      ) : null}
      <div className="max-h-80 overflow-y-auto">{children}</div>
      {footerHref ? (
        <Link
          href={footerHref}
          onClick={onClose}
          className="block border-t border-[#E5E7EB] px-4 py-2.5 text-center text-sm font-medium"
          style={{ color: 'var(--accent)' }}
        >
          {footerLabel}
        </Link>
      ) : null}
    </div>
  );
}

function MenuLink({
  href,
  icon,
  onClick,
  children,
}: {
  href: string;
  icon: Parameters<typeof Icon>[0]['name'];
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#1E293B] transition hover:bg-[#F8FAFC]"
    >
      <Icon name={icon} size={16} className="text-[#64748B]" />
      {children}
    </Link>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-4 py-6 text-center text-sm text-[#94A3B8]">{children}</p>;
}
