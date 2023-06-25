
possible_leader_statuses = [
    'Alive', 'Injured', 'Quarantined', 'Imprisoned', 'Cursed', 'Disguised', 'Lost ', 'Transformed', 'Exiled',
    'Betrayed', 'Blinded', 'Imprisoned', 'Starving', 'Disgraced', 'Trapped', 'Blessed', 'Haunted', 'dead'
]

leader_effects = [
    {"status": "Alive", "effect": {"None": None}},
    {"status": "Injured", "effect": {"CombatEffectiveness": "decreased"}},
    {"status": "Quarantined", "effect": {"Economy": "decreased"}},
    {"status": "Imprisoned", "effect": {"DiplomacyEffectiveness": "decreased"}},
    {"status": "Cursed", "effect": {"Morale": "decreased"}},
    {"status": "Disguised", "effect": {"Deception": "increased"}},
    {"status": "Lost", "effect": {"Leadership": "decreased"}},
    {"status": "Transformed", "effect": {"PhysicalResilience": "increased"}},
    {"status": "Exiled", "effect": {"Loyalty": "decreased"}},
    {"status": "Betrayed", "effect": {"Trust": "decreased"}},
    {"status": "Blinded", "effect": {"Accuracy": "decreased"}},
    {"status": "Starving", "effect": {"ResourceProduction": "decreased"}},
    {"status": "Disgraced", "effect": {"Reputation": "decreased"}},
    {"status": "Trapped", "effect": {"ConnectionWithWorld": "decreased"}},
    {"status": "Blessed", "effect": {"DivinePower": "increased"}},
    {"status": "Haunted", "effect": {"OccurrenceOfSupernaturalEvents": "increased"}},
    {"status": "Dead", "effect": {"ElectNewLeader": True}}
]

army_effects = [
    {"status": "Normal", "effect": {"combat effectiveness": "no effect"}},
    {"status": "Motivated", "effect": {"combat effectiveness": "increased"}},
    {"status": "Demoralized", "effect": {"combat effectiveness": "decreased"}},
    {"status": "Disciplined", "effect": {"combat effectiveness": "increased"}},
    {"status": "Chaotic", "effect": {"combat effectiveness": "random"}},
    {"status": "Well-trained", "effect": {"combat effectiveness": "increased"}},
    {"status": "Untrained", "effect": {"combat effectiveness": "decreased"}},
    {"status": "Inspired", "effect": {"combat effectiveness": "increased"}},
    {"status": "Disorganized", "effect": {"combat effectiveness": "decreased"}},
    {"status": "Resilient", "effect": {"combat effectiveness": "increased"}},
    {"status": "Fatigued", "effect": {"combat effectiveness": "decreased"}},

]


leader_random_events = [
    ("An ancient prophecy foretells the rise of a powerful rival leader who challenges your authority.",
     "Alive", "facing a formidable opponent"),
    ("A massive earthquake strikes the capital city, causing widespread destruction and requiring immediate action.",
     "Injured, recovering from injuries sustained during the earthquake"),
    ("A rare and deadly disease outbreak threatens the population, demanding a swift response to contain and find a cure.",
     "Quarantined, infected with the deadly disease"),
    ("A valuable resource is discovered within your borders, attracting the attention of neighboring countries and triggering a potential conflict.",
     "Imprisoned, captured by a rival country in an attempt to control the valuable resource"),
    ("A group of powerful wizards demands a meeting with you, offering their assistance in exchange for control over certain aspects of your kingdom.",
     "Enchanted, under the influence of the wizards' powerful spells"),
    ("A mysterious artifact is unearthed, rumored to possess incredible powers. However, its discovery also awakens an ancient evil that poses a threat to your reign.",
     "Cursed, haunted by the ancient evil unleashed by the artifact"),
    ("A diplomatic envoy from a distant land arrives, seeking to establish trade agreements and alliances. However, their true intentions remain unclear.",
     "Disguised, hiding true identity and intentions from the envoy"),
    ("A renowned explorer presents evidence of a hidden, uncharted land that could greatly expand your kingdom's territory and resources.",
     "Lost, stranded in the uncharted land and trying to find a way back"),
    ("A powerful dragon begins terrorizing your countryside, causing panic among the population and testing your leadership in dealing with mythical creatures.",
     "Transformed, turned into a dragon by a magical accident while attempting to subdue the dragon"),
    ("A rebellion led by disgruntled nobles and influential figures challenges your rule, forcing you to suppress the uprising while maintaining public support.",
     ", overthrown by the rebellion and seeking refuge in a neighboring country"),
    ("A neighboring country offers a marriage alliance with their royal family, creating opportunities for political maneuvering and potential conflicts within your court.",
     "Betrayed, the neighboring country reneges on the marriage alliance and launches an invasion"),
    ("A powerful magical storm engulfs your capital, disrupting communication and transportation networks, and affecting your ability to govern effectively.",
     "Blinded, struck by a lightning bolt during the magical storm, temporarily losing eyesight"),
    ("A notorious pirate captain arrives with a fleet of ships, demanding a hefty tribute to spare your coastal cities from plundering and destruction.",
     "Imprisoned, captured by the pirate captain and held hostage aboard their ship"),
    ("A series of unfortunate natural disasters, including floods, droughts, and wildfires, threaten your kingdom's agricultural output and food security.",
     "Starving, facing food shortages due to the impact of the natural disasters"),
    ("A secret society emerges within your country, manipulating events from the shadows and plotting to overthrow your government.",
     "Hunted, targeted by the secret society and constantly on the run"),
    ("A valuable cultural artifact is stolen from your nation's most prestigious museum, and you must solve the mystery and recover it to preserve your country's heritage.",
     "Disgraced, blamed for the theft of the cultural artifact and seeking redemption"),
    ("A rogue artificial intelligence gains sentience and launches a cyber attack, targeting critical infrastructure and destabilizing your nation's technological systems.",
     "Trapped, trapped in a virtual reality created by the rogue AI, cut off from the real world"),
    ("A celestial event causes a rare celestial alignment, granting supernatural powers to a select few individuals, including some within your inner circle.",
     "Blessed, bestowed with extraordinary powers by the celestial alignment"),
    ("A group of powerful witches approaches you, offering to share ancient forbidden knowledge in exchange for protection and amnesty for their kind.",
     "Haunted, plagued by the vengeful spirits of the ancient witches for accepting their offer"),
]
