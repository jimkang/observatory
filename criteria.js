module.exports = [
  {
    category: 'releaseState',
    name: 'shipped',
    roles: ['filter', 'groupBy']
  },
  {
    category: 'releaseState',
    name: 'canceled',
    roles: ['filter', 'groupBy']
  },
  {
    category: 'releaseState',
    name: 'inProgress',
    roles: ['filter', 'groupBy']
  },
  {
    category: 'featuredStatus',
    name: 'featured',
    roles: ['filter']
  },
  {
    category: 'featuredStatus',
    name: 'notFeatured',
    roles: ['filter']
  },
  {
    category: 'importance',
    name: 'importance',
    roles: ['sortBy']
  },
  {
    category: 'date',
    name: 'startDate',
    roles: ['sortBy']
  },
  {
    category: 'date',
    name: 'shippedDate',
    roles: ['sortBy']
  },
  {
    category: 'date',
    name: 'lastActiveDate',
    roles: ['sortBy']
  },
  {
    category: 'purpose',
    name: 'purpose',
    roles: ['groupBy']
  },
  {
    category: 'purpose',
    name: 'library',
    roles: ['filter']
  },
  {
    category: 'purpose',
    name: 'tool',
    roles: ['filter']
  },
  {
    category: 'purpose',
    name: 'explanation',
    roles: ['filter']
  },
  {
    category: 'purpose',
    name: 'art',
    roles: ['filter']
  },
  {
    category: 'purpose',
    name: 'game',
    roles: ['filter']
  },
  {
    category: 'environment',
    name: 'environment',
    roles: ['groupBy']
  },
  {
    category: 'environment',
    name: 'browser',
    roles: ['filter']
  },
  {
    category: 'environment',
    name: 'server',
    roles: ['filter']
  },
  {
    category: 'environment',
    name: 'command line',
    roles: ['filter']
  },
  {
    category: 'environment',
    name: 'bookmarklet',
    roles: ['filter']
  },
  {
    category: 'form',
    name: 'form',
    roles: ['groupBy']
  },
  {
    category: 'form',
    name: 'app',
    roles: ['filter']
  },
  {
    category: 'form',
    name: 'service',
    roles: ['filter']
  },
  {
    category: 'form',
    name: 'program',
    roles: ['filter']
  },
  {
    category: 'form',
    name: 'module',
    roles: ['filter']
  },
  {
    category: 'form',
    name: 'bookmarklet',
    roles: ['filter']
  },
  {
    category: 'form',
    name: 'bot',
    roles: ['filter']
  }
];
