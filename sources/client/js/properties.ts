import { Cell } from './grid/cell.js';
import { UserData } from './user/connection.js';

export class Global
{
	// User
	static connected = false;
	static user_data: UserData | null = null;

	// Client
	static socket: any;

	// Cell
	static hexagon_angle = 2 * Math.PI / 6.;
	static border_color = '#e1e2e8';
	static dark_color_limit = 200;

	// Grid
	static background_color = '#777A89';
	static grid_size = { x: 60, y: 30 };
	static grid: Cell[][] = [];
	static grid_boundaries = { x: 0, y: 0, width: 0, height: 0 };

	// Move
	static dragging = false;
	static show_drag = false;
	static drag_from = { x: 0, y: 0 };
	static drag_to = { x: 0, y: 0 };
	static cell_from: null | Cell = null;

	// Resources
	static skins: HTMLImageElement[] = [];
	static skin_colors: string[] = [];

	//Server
	static last_message: number = Date.now();
	static last_response: number = Date.now();
	 
}


export enum ClientSocket {
	DISCONNECT = '0',
	JOIN_GAME = '1',
	REGISTER = '2',
	LOGIN = '3',
	LOGOUT = '4',
	AUTO_LOGIN = '5',
	DELETE_ACCOUNT = '6',

	PING = '7',
	MOVES = '8',
	GRID_REQUEST = '9',

}

export enum ServerSocket {
	CHANGES = '0',
	GRID = '1',
	SPAWN = '2',
	DEATH = '3',
	LEADERBOARD = '4',
	

	REGISTER_ERROR = '5',
	REGISTERED = '6',

	LOGIN_ERROR = '7',
	LOGGED = '8',

	LOGOUT_ERROR = '9',
	UNLOGGED = 'A',

	AUTO_LOGIN_ERROR = 'B',
	AUTO_LOGGED = 'C',

	DELETE_ACCOUNT_ERROR = 'D',
	ACCOUNT_DELETED = 'E',
}
