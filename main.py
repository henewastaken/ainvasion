import json
import re
import openai
import random
from countries import finland, sweden, norway, belgium, czech_republic, denmark, germany, netherlands, poland, countries
from events import leader_effects
from game_events import to_send, to_receive

openai.api_key = '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'


def main_loop():

    STARTING_PROMPT = '''
        From now on, you are a dungeon master in an imaginary turn base world conquer game. 
        You will get a JSON containing data and events and you are required to come up with a short story about the event, the story can be as imaginative as you decide. 
        You must also return a JSON data about the event. 
        Also you are required to make decision about was the move a success or not.
        Also you can give players random special items, but they have to fit in the story. Also give these items a names and an effects.
        The events in the story must contain information from the JSON you receive and the JSON you return must also have data from your story.
        The content of the JSON is as follows'''

    ATTACK_JSON = '''
        Attacking event. Player is trying to invade a country mentioned in the JSON with a military invasion:
        to_attack = {
            "in_turn": this field will contain the players name who is making the move
            "where": contains the country player are trying conquer.
            "leader_Status": leader status will be type {"status": <which tells the leader status>, "effect": {<effect name>: <effect>}. You can Use the leader status in your story and decision making, but it is optional.
            "friendly_army_size": is number of the players army size
            "friendly_army_status": is type of {"status": which tells the army status, "effect": {effect name: effect}. Work similarly to leader_status.
            "enemy_army_size": is number of enemy army (the country player are attacking)
            "enemy_army_status": is type of {"status": which tells the enemy army status, "effect": {effect name: effect}. Work similarly to leader_status.
            "enemy_leader_status": is type of {"status": which tells the enemy leader status, "effect": {effect name: effect}. Work similarly to leader_status.
            "used_special_resources": is type {"item": <item name>, "effect": <effect>} works similarly to leader_status
        }
        From the JSON data, you need to make a conclusion was the attack successful.
        Use the army sizes, the different statuses and their effects and the used_special_recourses and their statuses. 
        For example, friendly_army_size is 500 000 soldiers larger than the enemy_army_size, but friendly_army_status is {"status": "Drunk", "effect": {"combat effectiveness": "decrease"}}, so they might not fight as well, but again you decide if you take it into account.

        After you have made you decision you will return short story and a JSON of following:
        returned_attack_event  = {
            "new_army_size": This will be the new friendly army size, based on your story. It can stay same, be smaller or larger, you decide.
            "new_leader_status": You can give the leader new status typed {"status": which tells the leader status, "effect": {<effect name>: <effect>}
            "success": true or false depending how you decide was the attack successful or not.
            "resources_from_story": if you gave player some items in the story, list them here in type {"item_name":<item name>, "effect": {<effect name>: effect}}
            "army_status_effect": You can also give the army some effect, just like leader status
        }
        JSON you return must be named returned_attack_event and in the end of the text.
        The to_attack JSON is as follows:
        '''

    DIPLOMATIC_JSON = '''
        Player is trying to make a peaceful diplomatic alliance with the country (mentioned in JSON) which if successful will merge the country to players empire.
        diplomatic = {
            "in_turn": this field will contain the players name who is making a move
            "where": contains the country player are trying to target.
            "leader_Status": leader status will be type {"status": <which tells the leader status>, "effect": {<effect name>: <effect>}. You can Use the leader status in your story and decision making, but it is optional.
            "friendly_army_size": is number of the players army size
            "friendly_army_status": is type of {"status": which tells the army status, "effect": {effect name: effect}. Work similarly to leader_status.
            "enemy_army_size": is number of enemy army(the country player are attacking)
            "enemy_army_status": is type of {"status": which tells the enemy army status, "effect": {effect name: effect}. Work similarly to leader_status.
            "enemy_leader_status": is type of {"status": which tells the enemy leader status, "effect": {effect name: effect}. Work similarly to leader_status.
            "used_special_resources": is type {"item": <item name>, "effect": <effect>} works similarly to leader_status 
            "offered_resource": This will be a list of resources player have offered  to "sweeten the deal". Every country had a favorite and hated resource and take them into calculations when you make the decision of the event and story. Again there are just guidelines, you deicide the result in the end.
            "enemy_hated_resource: This will contain the resource the country hates and if player offers this to "sweeten the deal" it might have negative effect on the success, but again, you choose if it has or not.
            "enemy_loved_resource: This will contain the resource the country hates and if player offers this to "sweeten the deal" it might have positive effect on the success, but again, you choose if it has or not.
        }
        From the JSON data, you need to make a conclusion was the diplomatic deal successful.
        Use the army sizes, the different statuses and their effects and the used_special_recourses and their statuses. 

        After you have made you decision you will return short story and a JSON of following:
        returned_diplomatic_event = {
            "new_leader_status": You can give the leader new status typed {"status": which tells the leader status, "effect": {<effect name>: <effect>}
            "success": yes or no depending how you decide
            "random_resources_from_the_story": if you game some random items in the story, they are listed here in type {"itemName":<item name>, "effect":<effect>}
            "army_status_effect": You can also give the army some effect, just like leader status
        }
        JSON you return must be named returned_diplomatic_event and in the end of the text.
        The diplomatic JSON is as follows:        '''

    text = '''
            Returning to the JSON data, the updated attack event information would be as follows:\n\nreturned_attack_event = {\n    \"new_army_size\": 4100,\n    \"new_leader_status\": {\n        \"status\": \"Victorious Conqueror\",\n        \"effect\": {\"morale\": \"increase\"}\n    },\n    \"success\": true,\n    \"resources_from_story\": [\n        {\"item_name\": \"fish\", \"effect\": {\"combat effectiveness\": \"increase\"}},\n        {\"item_name\": \"food\", \"effect\": {\"morale\": \"increase\"}}\n    ],\n    \"army_status_effect\": null\n}\n\nWith the successful conquest of Finland, Player's army stood at a new size of 4100 soldiers. The leader, now hailed as the \"Victorious Conqueror,\" had an effect that boosted the morale of the army. The \"fish\" resource was found

    '''
    # print(text.split('returned_attack_event')[1])
    # Extract everything between curly braces {}s
    json_match = re.search(r'\{[^}]+\}', text)

    if json_match:
        json_data = json_match.group(0)

        # Load the JSON data as a dictionary
        try:
            parsed_data = json.loads(json_data)

            # Print the extracted JSON data
            print(json.dumps(parsed_data, indent=2))
        except json.JSONDecodeError as e:
            print(f"Error decoding JSON data: {e}")
    else:
        print("JSON data not found in the text.")

    def call_openai(prompt, data):

        action = openai.ChatCompletion.create(
            model="gpt-3.5-turbo-16k",
            # prompt=STARTING_PROMPT + ATTACK_JSON,
            messages=[
                {"role": "user", "content": STARTING_PROMPT + ATTACK_JSON + data}
            ],
            temperature=0.8,
            max_tokens=3500
        )
        print(action)

    def to_send(special_items):
        used_special_resources = [i for i in special_items]
        print(used_special_resources)
        # TODO: Update JSON
        data = {
            "in_turn": in_turn,
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
                input(f'Please choose a starting country '))
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
            'Please choose an action. a: attack, d: Diplomatic alliance. q: Quits the game.')
        # Exit command
        if action == 'q':
            game_active = False

        # ===== Attacking =====
        elif action == 'a':
            print('Neighbor countries:', player_neighbors)
            # Player input
            country_to_attack = input(
                'Which neighbor country do you want to attack? Type its name. c: cancel.')

            # Cancel action and exit loop to main menu
            if country_to_attack == 'c':
                continue

            # TODO: Ai attacking stuff
            # Iterate trough players empire
            for country in player_countries:
                # Check that country to attack is bordering country
                if country_to_attack in country['neighbor_countries']:
                    # TODO: AI event choosing here

                    test_items = [{'item': 'fish', 'effect': 'magic'},
                                  {'item': 'food', 'effect': 'morale'}]

                    # Create json of data to send to AI
                    data = to_send(test_items)
                    print(data)
                    call_openai(ATTACK_JSON, data)
                    # is_attack_successful = random.randint(0, 1)
                    # if is_attack_successful:

                    #     # Add the attacked country to player
                    #     player_countries.append(eval(country_to_attack))
                    #     player_countries_string.append(
                    #         eval(country_to_attack)['name'])

                    #     # Update the border
                    #     player_neighbors.update(
                    #         eval(country_to_attack)['neighbor_countries'])
                    #     player_neighbors = player_neighbors - \
                    #         set(player_countries_string)

                    #     print('You successfully conquered', country_to_attack,
                    #           '. Yor empire now consists of ', player_countries_string)

                    #     # Choose randomly new leader_status and update it.
                    #     player_leader_status = random.choice(
                    #         leader_effects)

                    #     print('While attacking your leader status changed to',
                    #           player_start_country['leader_status'])
                    #     print('Your new neighbors countries are',
                    #           player_neighbors)
                    #     break
                    # else:
                    #     print('attack failed')
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
