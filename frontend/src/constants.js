export const CONDITION_LABELS = {
  new: 'Brand New - Never Used',
  like_new: 'Like New - Barely Used',
  good: 'Good - Minor Wear',
  fair: 'Fair - Visible Signs of Use',
  poor: 'Heavy Wear',
  needs_repair: 'Needs Repair'
};

export const CATEGORIES = ['All Archives', 'Books', 'Electronics', 'Apparel', 'Miscellaneous'];

export const HOSTEL_GROUPS = {
  'Boys Hostels': ['BH1', 'BH2', 'BH3', 'BH4', 'BH5', 'BH6', 'BH7', 'BH8', 'BH9', 'BH10'],
  Other: ['Boys Studio', 'Day Scholar', 'Staff Residence'],
  'Girls Hostels': ['GH1', 'GH2', 'GH3', 'GH4', 'GH5', 'GH6']
};

export const ALL_HOSTELS = Object.values(HOSTEL_GROUPS).flat();
