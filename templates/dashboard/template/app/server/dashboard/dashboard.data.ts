export function getDashboardSnapshot() {
  return {
    generatedAt: new Date().toISOString(),
    metrics: [
      { label: 'Monthly revenue', value: '$48,290', change: '+12.4%' },
      { label: 'Active accounts', value: '12,849', change: '+8.1%' },
      { label: 'Conversion', value: '7.28%', change: '+1.9%' },
      { label: 'API uptime', value: '99.99%', change: '+0.02%' },
    ],
    activity: [
      {
        id: 'evt_128',
        event: 'Subscription upgraded',
        actor: 'Acme Inc.',
        time: '2m ago',
      },
      {
        id: 'evt_127',
        event: 'Workspace created',
        actor: 'Northstar',
        time: '18m ago',
      },
      {
        id: 'evt_126',
        event: 'Invoice paid',
        actor: 'Linear Labs',
        time: '41m ago',
      },
      {
        id: 'evt_125',
        event: 'Member invited',
        actor: 'Polar Studio',
        time: '1h ago',
      },
    ],
  };
}
