to_send = {
    "in_turn": "",
    "action": "",
    "where": "",
    "leader_Status": '',
    "friendly_army_size": 0,
    "friendly_army_status": '',
    "enemy_army_size": 0,
    "enemy_army_status": '',
    "enemy_leader_status": '',
    "resources": [""],
    "used_special_resources": {
        "item": "",
        "effect": ""
    }
}

to_receive = {
    "new_army_size": 0,
    "new_leader_status": "",
    "success": None,
    "random_resources_from_the_story": '',
    "army_status_effect": ''
}

# to_send = {
#   "in_turn": "finland",
#   "action": "attack", // can be at attack, diplomatic_treaty, research, heal_leaded
#   "where": "estonia", // Any neighboring country
#   "leader_Status": // From events leader_effects,
#   "friendly_army_size": 3750,
#   "friendly_army_status": // From events army_effects,
#   "enemy_army_size": 7800,
#   "enemy_army_status: // From events army_effects,
#   "enemy_leader_status": // From events leader_effects,
#   "resources": ["timber", "iron ore"],
#   "used_special_resources": { // Any special_resource player has, or None
#     "item": "Magical Fish",
#     "effect": "Decreased enemy army morale"
#   }
# }

# receive = {
#   "new_army_size": 3750,
#   "new_leader_status": "Disguised",
#   "success": true,
#   "random_resources_from_the_story": None // Either none, type {"item": "foo","effect": "bar"}
#   "army_status_effect": //from events army_effects
# }
