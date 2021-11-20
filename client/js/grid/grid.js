// Create the grid of cells
function create_grid()
{
	let x = 0
	let y = 0;
	let y_offset = 0;

	for (let i = 0; i < grid_size.x; i++)
	{
		grid.push([]);
		y = 0;
		y_offset = i % 2 ? Math.sin(hexagon_angle) : 0;

		for (let j = 0; j < grid_size.y; j++)
		{
			grid[i].push(new Cell(i, j, x, y + y_offset, "#FFFFFF", '', 0));
			y += Math.sin(hexagon_angle) * 2;
		}

		x += 1 + Math.cos(hexagon_angle);
	}

	grid_boundaries.width = x;
	grid_boundaries.height = y + y_offset;
}

// Draw the grid on the screen
function draw_grid(context)
{
	for (let i = 0; i < grid_size.x; i++)
		for (let j = 0; j < grid_size.y; j++)
			grid[i][j].draw(context);
}

// Give the cell at the given coordinates
function get_cell(x, y)
{
	if (x < 0 || x >= grid_size.x || y < 0 || y >= grid_size.y)
		return null;

	return grid[x][y];
}

// Set cell values from a change
function set_cell(change)
{
	if (change.i < 0 || change.i >= grid_size.x || change.j < 0 || change.j >= grid_size.y)
		return null;

	grid[change.i][change.j].color = change.color;
	grid[change.i][change.j].user_id = change.user_id;
	grid[change.i][change.j].nb_troops = change.nb_troops;

	return grid[change.i][change.j];
}

// Give the cell from the mouse position
function get_cell_from_mouse(x, y)
{
	let mouse_pos = camera.screen_to_canvas(x, y);

	let distance = 100000;
	let index = { x: 0, y: 0 };

	for (let i = 0; i < grid_size.x; i++)
		for (let j = 0; j < grid_size.y; j++)
		{
			let temp = Math.sqrt(Math.pow(mouse_pos.x - grid[i][j].x, 2) + Math.pow(mouse_pos.y - grid[i][j].y, 2));

			if (temp < distance)
			{
				distance = temp;
				index = { x: i, y: j };
			}
		}

	if (distance > 1.)
		return null;

	return grid[index.x][index.y];
}

// Update the grid from the server data
function update_grid_from_server(socket)
{
	// When the server send the grid
	socket.on('grid_to_client', server_grid =>
	{
		for (let i = 0; i < grid_size.x; i++)
			for (let j = 0; j < grid_size.y; j++)
			{
				grid[i][j].color = server_grid[i][j].color;
				grid[i][j].user_id = server_grid[i][j].user_id;
				grid[i][j].nb_troops = server_grid[i][j].nb_troops;
			}

		render();
	});

	// Ask the server for the grid
	socket.emit('ask_for_grid');
}