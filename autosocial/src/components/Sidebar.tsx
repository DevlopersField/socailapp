'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: '⊞' },
  { label: 'Brain', href: '/brain', icon: '🧠' },
  { label: 'Trends', href: '/trends', icon: '📈' },
  { label: 'Content Creator', href: '/content', icon: '✏' },
  { label: 'Scheduler', href: '/scheduler', icon: '◷' },
  { label: 'Packages', href: '/packages', icon: '⊡' },
  { label: 'Analytics', href: '/analytics', icon: '▲' },
  { label: 'Guides', href: '/guides', icon: '📖' },
  { label: 'Settings', href: '/settings', icon: '⚙' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <aside
      style={{
        width: collapsed ? '64px' : '240px',
        minWidth: collapsed ? '64px' : '240px',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        transition: 'width 0.25s ease, min-width 0.25s ease',
      }}
      className="flex flex-col h-screen sticky top-0 overflow-hidden"
    >
      {/* Brand */}
      <div
        style={{
          borderBottom: '1px solid var(--border)',
          height: '64px',
        }}
        className="flex items-center gap-3 px-4 shrink-0"
      >
        <span
          style={{
            background: 'var(--primary)',
            borderRadius: '8px',
            width: '32px',
            height: '32px',
            fontSize: '16px',
            flexShrink: 0,
          }}
          className="flex items-center justify-center"
          aria-hidden="true"
        >
          ⚡
        </span>
        <span
          style={{
            color: 'var(--text-primary)',
            fontWeight: 700,
            fontSize: '15px',
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            opacity: collapsed ? 0 : 1,
            transition: 'opacity 0.2s ease',
            pointerEvents: collapsed ? 'none' : 'auto',
          }}
        >
          AutoSocial
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto" aria-label="Main navigation">
        <ul className="flex flex-col gap-1 px-2" role="list">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: collapsed ? '10px 16px' : '10px 12px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    transition: 'background 0.15s ease, color 0.15s ease',
                    background: active
                      ? 'color-mix(in srgb, var(--primary) 15%, transparent)'
                      : 'transparent',
                    color: active ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: active ? 600 : 400,
                    fontSize: '14px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                  aria-current={active ? 'page' : undefined}
                  className="hover:bg-white/5 hover:text-[var(--text-primary)]"
                >
                  {active && (
                    <span
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '3px',
                        height: '20px',
                        background: 'var(--primary)',
                        borderRadius: '0 2px 2px 0',
                      }}
                      aria-hidden="true"
                    />
                  )}
                  <span
                    style={{
                      fontSize: '18px',
                      flexShrink: 0,
                      lineHeight: 1,
                      width: '24px',
                      textAlign: 'center',
                    }}
                    aria-hidden="true"
                  >
                    {item.icon}
                  </span>
                  <span
                    style={{
                      opacity: collapsed ? 0 : 1,
                      transition: 'opacity 0.2s ease',
                      pointerEvents: collapsed ? 'none' : 'auto',
                    }}
                  >
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse toggle */}
      <div
        style={{ borderTop: '1px solid var(--border)', padding: '12px 8px' }}
        className="shrink-0"
      >
        <button
          onClick={() => setCollapsed((prev) => !prev)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 12px',
            borderRadius: '8px',
            border: 'none',
            background: 'transparent',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'background 0.15s ease, color 0.15s ease',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
          className="hover:bg-white/5 hover:text-[var(--text-secondary)]"
        >
          <span
            style={{
              fontSize: '18px',
              flexShrink: 0,
              lineHeight: 1,
              width: '24px',
              textAlign: 'center',
              display: 'inline-block',
              transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.25s ease',
            }}
            aria-hidden="true"
          >
            ◀
          </span>
          <span
            style={{
              opacity: collapsed ? 0 : 1,
              transition: 'opacity 0.2s ease',
              pointerEvents: collapsed ? 'none' : 'auto',
            }}
          >
            Collapse
          </span>
        </button>
      </div>
    </aside>
  );
}
