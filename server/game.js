import * as Grid from './grid/grid.js';
import { User } from './users/users.js';
const initial_nb_troops = 10;
const troops_spawn_max = 10;
const troops_max = 999;
const spawn_time = 10;
export function join_game(socket, io) {
    socket.on('ask_for_grid', () => {
        socket.emit('grid_to_client', Grid.get_grid());
    });
    socket.on('join_game', input_user => {
        let user = new User(socket.id, input_user.nickname, input_user.color, 1);
        User.user_join(user);
        let spawn = Grid.get_random_cell();
        const change = {
            i: spawn.i,
            j: spawn.j,
            color: user.color,
            user_id: user.id,
            nb_troops: initial_nb_troops
        };
        io.emit('change', change);
        Grid.set_cell(change);
        socket.emit('send_joining_data', { socket_id: socket.id, spawn: spawn });
    });
}
export function game_events(socket, io) {
    move(socket, io);
}
export function game_loop(io) {
    troops_spawn(io);
}
export function player_death(io, socket_id) {
    User.user_leave(socket_id);
    io.to(socket_id).emit('death');
}
export function leave_game(socket, io) {
    socket.on('disconnect', () => {
        const user = User.user_leave(socket.id);
        if (user != null)
            Grid.remove_user_from_grid(user, io);
    });
}
export function move(socket, io) {
    socket.on('move', cells => {
        let cell_from = Grid.get_cell(cells.from.i, cells.from.j);
        let cell_to = Grid.get_cell(cells.to.i, cells.to.j);
        if (cell_from != null && cell_to != null && cell_from.user_id == socket.id && Grid.are_neighbours(cells.from, cells.to) && cell_from.nb_troops > 1) {
            if (cell_to.user_id == socket.id) {
                cell_to.nb_troops += cell_from.nb_troops - 1;
                cell_from.nb_troops = 1;
                if (cell_to.nb_troops > troops_max) {
                    cell_from.nb_troops += cell_to.nb_troops - troops_max;
                    cell_to.nb_troops = troops_max;
                }
            }
            else {
                if (cell_from.nb_troops > cell_to.nb_troops + 1) {
                    let user_from = User.get_user(cell_from.user_id);
                    let user_to = User.get_user(cell_to.user_id);
                    if (user_from != null && user_to != null) {
                        user_from.size++;
                        if (cell_to.user_id != '') {
                            user_to.size--;
                            if (user_to.size == 0)
                                player_death(io, cell_to.user_id);
                        }
                    }
                    cell_to.nb_troops = cell_from.nb_troops - cell_to.nb_troops - 1;
                    cell_from.nb_troops = 1;
                    cell_to.color = cell_from.color;
                    cell_to.user_id = cell_from.user_id;
                }
                else {
                    cell_to.nb_troops -= cell_from.nb_troops - 1;
                    cell_from.nb_troops = 1;
                    if (cell_to.nb_troops == 0)
                        cell_to.nb_troops = 1;
                }
            }
            const change_1 = {
                i: cells.from.i,
                j: cells.from.j,
                color: cell_from.color,
                user_id: cell_from.user_id,
                nb_troops: cell_from.nb_troops
            };
            const change_2 = {
                i: cells.to.i,
                j: cells.to.j,
                color: cell_to.color,
                user_id: cell_to.user_id,
                nb_troops: cell_to.nb_troops
            };
            io.emit('changes', { changes: [change_1, change_2], is_move: true });
        }
    });
}
export function troops_spawn(io) {
    var troops_spawn_interval = setInterval(() => {
        let { i, j } = Grid.get_random_cell();
        let cell = Grid.get_cell(i, j);
        if (cell != null && cell.user_id != '' && cell.nb_troops < troops_spawn_max) {
            cell.nb_troops++;
            const change = {
                i: i,
                j: j,
                color: cell.color,
                user_id: cell.user_id,
                nb_troops: cell.nb_troops
            };
            io.emit('change', change);
        }
    }, spawn_time);
}
