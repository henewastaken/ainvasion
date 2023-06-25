import json
import random
from countries import finland, sweden, norway, belgium, czech_republic, denmark, germany, netherlands, poland, countries
from events import leader_effects
from game_events import to_send, to_receive


def main_loop():
    def to_send(special_items):
        used_special_resources = [i for i in special_items]
        print(used_special_resources)
        data = {
            "in_turn": in_turn,
            "action": action,
            "where": country_to_attack,
            "leader_Status": player_leader_status,
            "friendly_army_size": player_army_size,
            "friendly_army_status": player_army_status,
            "enemy_army_size": eval(country_to_attack)['army_size'],
            "enemy_army_status": eval(country_to_attack)['army_status'],
            "enemy_leader": eval(country_to_attack)['leader'],
            "enemy_leader_status": eval(country_to_attack)['leader_status'],
            "resources": player_resources,
            "used_special_resources": used_special_resources
        }

        return json.dumps(data)
    # Ask player for staring country
    while True:
        try:
            player_start_country = eval(
                input(f'Please choose a starting country from {countries} '))
            break
        except Exception:
            print("That country does not exists")

    game_active = True

    player_countries = [player_start_country]
    player_countries_string = [player_start_country['name']]
    player_neighbors = set(player_start_country['neighbor_countries'])
    player_leader = player_start_country['leader']
    player_leader_status = player_start_country['leader_status']
    player_army_size = player_start_country['army_size']
    player_army_status = player_start_country['army_status']
    player_resources = player_start_country['special_resource']

    ai_start_country = sweden
    ai_countries = [ai_start_country]
    ai_countries_string = [ai_start_country['name']]
    ai_neighbors = set(ai_start_country['neighbor_countries'])

    players_turn = True
    in_turn = 'Player' if players_turn else 'Computer'

    while game_active:
        players_turn = not players_turn
        # Ask player for action
        action = input(
            'Please choose an action. a: attack, d: Diplomatic alliance. q: Quits the game.  ')
        # Exit command
        if action == 'q':
            game_active = False

        # ===== Attacking =====
        elif action == 'a':
            print('Neighbor countries:', player_neighbors)
            # Player input
            country_to_attack = input(
                'Which neighbor country do you want to attack? Type its name. c: cancel. ')

            # Cancel action and exit loop to main menu
            if country_to_attack == 'c':
                continue

            # TODO: Ai attacking stuff
            # Iterate trough players empire
            for country in player_countries:
                # Check that country to attack is bordering country
                if country_to_attack in country['neighbor_countries']:
                    # TODO: AI event choosing here

                    test = [{'item': 'fish', 'effect': 'magic'},
                            {'item': 'food', 'effect': 'morale'}]

                    # Create json of data to send to AI
                    json_to_send = to_send(test)
                    print(json_to_send)

                    is_attack_successful = random.randint(0, 1)
                    if is_attack_successful:

                        # Add the attacked country to player
                        player_countries.append(eval(country_to_attack))
                        player_countries_string.append(
                            eval(country_to_attack)['name'])

                        # Update the border
                        player_neighbors.update(
                            eval(country_to_attack)['neighbor_countries'])
                        player_neighbors = player_neighbors - \
                            set(player_countries_string)

                        print('You successfully conquered', country_to_attack,
                              '. Yor empire now consists of ', player_countries_string)

                        # Choose randomly new leader_status and update it.
                        player_leader_status = random.choice(
                            leader_effects)

                        print('While attacking your leader status changed to',
                              player_start_country['leader_status'])
                        print('Your new neighbors countries are',
                              player_neighbors)
                        break
                    else:
                        print('attack failed')
                else:
                    print("I'm sorry, couldn't find that country")
                    break

        # ===== Diplomatic ======
        elif action == 'd':
            print('Neighbor countries:', player_neighbors)
            # Player input
            country_to_attack = input(
                'Which neighbor country do you want to do diplomatic alliance with? Type its name. c: cancel. ')

            # Cancel action and exit loop to main menu
            if country_to_attack == 'c':
                continue

            # TODO: Ai diplomatic stuff
            for country in player_countries:
                if country_to_attack in country['neighbor_countries']:
                    is_diplomatic_success = random.randint(0, 1)
                    if is_diplomatic_success:

                        # Add the new country to player
                        player_countries.append(eval(country_to_attack))
                        player_countries_string.append(
                            eval(country_to_attack)['name'])

                        # Update the border
                        player_neighbors.update(
                            eval(country_to_attack)['neighbor_countries'])
                        player_neighbors = player_neighbors - \
                            set(player_countries_string)

                        # Choose randomly new leader_status and update it.
                        player_start_country['leader_status'] = random.choice(
                            leader_effects)

                        print('You successfully made diplomatic alliance and', country_to_attack,
                              'joined your empire. Your empire now consists of', player_countries_string)
                        print('Your new neighbors countries are',
                              player_neighbors)
                        break

                    else:
                        print(
                            f'{country_to_attack} did not want to join your empire.')
                        break
                else:
                    print("I'm sorry, couldn't find that country")


main_loop()
