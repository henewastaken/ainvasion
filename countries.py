from events import leader_effects, army_effects

finland = {
    'name': 'finland',
    'neighbor_countries': ['norway', 'sweden', 'russia'],
    'leader': 'Jari Virtanen',
    'leader_status': leader_effects[0],
    'army_size': 5000,
    'army_status': army_effects[0],
    'special_resource': 'Northern Lights Crystals',
    'loved_resource': 'Birch Wood',
    'hated_resource': 'Coal',
}

norway = {
    'name': 'norway',
    'neighbor_countries': ['finland', 'sweden', 'denmark'],
    'leader': 'Erik Larsen',
    'leader_status': leader_effects[0],
    'army_size': 6000,
    'army_status': army_effects[0],
    'special_resource': 'Viking Gold',
    'loved_resource': 'Fish',
    'hated_resource': 'Iron Ore',
}

sweden = {
    'name': 'sweden',
    'neighbor_countries': ['norway', 'finland', 'denmark'],
    'leader': 'Ingrid Andersson',
    'leader_status': leader_effects[0],
    'army_size': 5500,
    'army_status': army_effects[0],
    'special_resource': 'Nordic Steel',
    'loved_resource': 'Timber',
    'hated_resource': 'Wheat',
}

denmark = {
    'name': 'denmark',
    'neighbor_countries': ['sweden', 'norway', 'germany'],
    'leader': 'Lars Jensen',
    'leader_status': leader_effects[0],
    'army_size': 4500,
    'army_status': army_effects[0],
    'special_resource': 'Viking Runes',
    'loved_resource': 'Dairy Products',
    'hated_resource': 'Salt',
}

germany = {
    'name': 'germany',
    'neighbor_countries': ['denmark', 'netherlands', 'poland'],
    'leader': 'Hans Müller',
    'leader_status': leader_effects[0],
    'army_size': 8000,
    'army_status': army_effects[0],
    'special_resource': 'Black Forest Timber',
    'loved_resource': 'Beer',
    'hated_resource': 'Steel',
}

netherlands = {
    'name': 'netherlands',
    'neighbor_countries': ['germany', 'belgium'],
    'leader': 'Anna van der Berg',
    'leader_status': leader_effects[0],
    'army_size': 4000,
    'army_status': army_effects[0],
    'special_resource': 'Tulip Bulbs',
    'loved_resource': 'Fish',
    'hated_resource': 'Wood',
}

belgium = {
    'name': 'belgium',
    'neighbor_countries': ['netherlands', 'germany', 'france'],
    'leader': 'Philippe Dubois',
    'leader_status': leader_effects[0],
    'army_size': 3500,
    'army_status': army_effects[0],
    'special_resource': 'Belgian Chocolate',
    'loved_resource': 'Beer',
    'hated_resource': 'Iron Ore',
}

poland = {
    'name': 'poland',
    'neighbor_countries': ['germany', 'czech republic', 'russia'],
    'leader': 'Marek Nowak',
    'leader_status': leader_effects[0],
    'army_size': 6000,
    'army_status': army_effects[0],
    'special_resource': 'Amber',
    'loved_resource': 'Potatoes',
    'hated_resource': 'Coal',
}

czech_republic = {
    'name': 'czech republic',
    'neighbor_countries': ['poland', 'germany', 'austria'],
    'leader': 'Petra Novakova',
    'leader_status': leader_effects[0],
    'army_size': 5000,
    'army_status': army_effects[0],
    'special_resource': 'Bohemian Crystal',
    'loved_resource': 'Beer',
    'hated_resource': 'Iron Ore',
}


countries = [finland, norway, sweden, denmark, germany,
             netherlands, belgium, poland, czech_republic]


'''
- Neighbor countries
  - Army size (If 0, cannot be used until uses turn to recruit more citizens)
  - Leader
  - Leader status (REbelling, missing, alive, dead, puppet for illuminati etc)
  - Special resource
  - Loved recourse (increases chance of diplomatic alliance)
  - Hated resource (decreases above)
  '''
