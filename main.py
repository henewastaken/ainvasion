from countries import finland, sweden, norway


def main_loop():

    game_active = True
    # TODO: Get this from player
    player_start_country = finland
    player_countries = [player_start_country]
    player_countries_string = [player_start_country['name']]
    player_neighbors = set(player_start_country['neighbor_countries'])

    ai_start_country = sweden
    ai_countries = [ai_start_country]
    ai_countries_string = [ai_start_country['name']]
    ai_neighbors = set(ai_start_country['neighbor_countries'])

    while game_active:
        action = input(
            'Please choose an action. a: attack, d: Diplomatic alliance. q: Quits the game.  ')
        if action == 'q':
            game_active = False
        elif action == 'a':
            print('Neighbor countries:', player_neighbors)
            country_to_attack = input(
                'Which neighbor country do you want to attack? Type its name. c: cancel. ')
            if country_to_attack == 'c':
                continue
            # TODO: Ai attacking stuff
            for country in player_countries:
                if country_to_attack in country['neighbor_countries']:
                    player_countries.append(eval(country_to_attack))
                    player_neighbors.update(
                        eval(country_to_attack)['neighbor_countries'])
                    player_countries_string.append(
                        eval(country_to_attack)['name'])
                    print('You successfully conquered', country_to_attack,
                          '. Yor empire now consists of ', player_countries_string)
                    player_neighbors = player_neighbors - \
                        set(player_countries_string)
                    print('Your new neighbors countries are', player_neighbors)
                    break
                else:
                    print("I'm sorry, couldn't find that country")
                    break
        elif action == 'd':
            print('Neighbor countries:', player_neighbors)
            country_to_attack = input(
                'Which neighbor country do you want to do diplomatic alliance with? Type its name. c: cancel. ')
            if country_to_attack == 'c':
                continue
            # TODO: Ai diplomatic stuff
            for country in player_countries:
                if country_to_attack in country['neighbor_countries']:
                    player_countries.append(eval(country_to_attack))
                    player_neighbors.update(
                        eval(country_to_attack)['neighbor_countries'])
                    player_countries_string.append(
                        eval(country_to_attack)['name'])
                    print('You successfully made diplomatic alliance and', country_to_attack,
                          'joined your empire. Your empire now consists of', player_countries_string)
                    player_neighbors = player_neighbors - \
                        set(player_countries_string)
                    print('Your new neighbors countries are', player_neighbors)
                    break
                else:
                    print("I'm sorry, couldn't find that country")
                    break


main_loop()
