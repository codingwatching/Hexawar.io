import * as Grid from './grid/grid.js';
import { Player } from './players/player.js';
import { Global } from './properties.js';
import { Change } from './grid/cell.js';
import * as Utils from './utils/utils.js';

export type Move = {
	from: { i: number, j: number },
	to: { i: number, j: number }
}

// Handle a player joining the game
export function join(player: Player)
{
	// Send the grid
	player.socket.on('ask_for_grid', () =>
	{
		player.socket.emit('grid_to_client', Grid.get_client_grid());
	});

	// Register the player
	player.socket.on('join_game', (input_player: { nickname: string, color: string, skin_id: number }) =>
	{
		player.nickname = input_player.nickname;

		if (Utils.is_color(input_player.color))
			player.color = input_player.color;
		else
			player.color = Utils.random_color();

		if (input_player.skin_id == -1)
			player.skin_id = -1;
		else if (player.user != null && player.user.skins.includes(input_player.skin_id))
			player.skin_id = input_player.skin_id;
		else
			player.skin_id = -1;

		// Add the player in the players list
		if (player.join())
		{
			// Give it a random cell
			let spawn = Grid.get_random_cell();

			// Set the change
			const change = {
				i: spawn.i,
				j: spawn.j,
				color: player.color,
				skin_id: player.skin_id,
				player: player,
				nb_troops: Global.initial_nb_troops
			};

			Grid.set_cell(change);
			player.socket.emit('send_spawn', spawn);
		}
	});
}

// The events of the game
export function game_events(player: Player)
{
	player_moves(player);
}

// Loops of the game
export function game_loop()
{
	troops_spawn();
}

// Handle a player leaving the game
export function leave_game(player: Player)
{
	// When client disconnects
	player.socket.on('disconnect', () =>
	{
		player.leave();
		Grid.remove_player_from_grid(player);
	});
}

// Handle player moves
export function player_moves(player: Player)
{
	function move_event(move: Move)
	{
		let cell_from = Grid.get_cell(move.from.i, move.from.j);
		let cell_to = Grid.get_cell(move.to.i, move.to.j);

		// If the move is valid
		if (cell_from != null && cell_to != null && cell_from.player == player && Grid.are_neighbours(move.from, move.to) && cell_from.nb_troops > 1)
		{
			let change_from = {
				i: move.from.i,
				j: move.from.j,
				color: cell_from.color,
				skin_id: cell_from.skin_id,
				player: cell_from.player,
				nb_troops: cell_from.nb_troops
			};

			let change_to = {
				i: move.to.i,
				j: move.to.j,
				color: cell_to.color,
				skin_id: cell_to.skin_id,
				player: cell_to.player,
				nb_troops: cell_to.nb_troops
			};

			// If it's a simple move
			if (change_to.player == player)
			{
				change_to.nb_troops += change_from.nb_troops - 1;
				change_from.nb_troops = 1;

				// If there are too many troops
				if (change_to.nb_troops > Global.troops_max)
				{
					change_from.nb_troops += change_to.nb_troops - Global.troops_max;
					change_to.nb_troops = Global.troops_max;
				}
			}

			// If it's an attack
			else
			{
				// If the attack succeeds
				if (change_from.nb_troops > change_to.nb_troops + 1)
				{
					change_to.nb_troops = change_from.nb_troops - change_to.nb_troops - 1;
					change_from.nb_troops = 1;
					change_to.color = change_from.color;
					change_to.skin_id = change_from.skin_id;
					change_to.player = change_from.player;
				}

				// If the attack fails
				else
				{
					change_to.nb_troops -= change_from.nb_troops - 1;
					change_from.nb_troops = 1;

					// Add one troop to the defender if it's cell is empty
					if (change_to.nb_troops == 0)
						change_to.nb_troops = 1;
				}
			}

			Grid.set_cells([change_from, change_to], true);
		}
	}

	player.socket.on('move', (move: Move) => { move_event(move); });
	player.socket.on('moves', (moves: Move[]) => { moves.forEach(move => move_event(move)); });
}

// Handle troops spawning
export function troops_spawn()
{
	var troops_spawn_interval = setInterval(() =>
	{
		let changes: Change[] = [];

		for (let _ = 0; _ < Global.spawn_per_sec; _++)
		{
			// Choose the cell
			let { i, j } = Grid.get_random_cell();
			let cell = Grid.get_cell(i, j);

			// If the cell isn't empty
			if (cell != null && cell.player != null)
			{
				// Add the change to the list
				let change = {
					i: i,
					j: j,
					color: cell.color,
					skin_id: cell.skin_id,
					player: cell.player,
					nb_troops: cell.nb_troops
				};

				// Add troops if there are not enough
				if (change.nb_troops < Global.troops_spawn_max)
				{
					change.nb_troops++;
					changes.push(change);
				}

				// Remove troops if there are too many
				else if (change.nb_troops > Global.troops_spawn_max)
				{
					change.nb_troops--;
					changes.push(change);
				}
			}
		}

		Grid.set_cells(changes, false);
	}, 1000);
}
