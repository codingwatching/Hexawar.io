// Give a random integer between two numbers
function random_int(min, max)
{
	return Math.floor(Math.random() * (max - min)) + min;
}

module.exports = random_int;
