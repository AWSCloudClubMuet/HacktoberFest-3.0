I have continued with milestone 2, where i added two featurres to the music player. Users can queue songs to play next, they can go back to songs they just heard. Its one class is built on a Queue and stack.
Upnext is a deque used as queue (fifo), songs play in the order they were added.
history is deque(maxlen=10) used as a stack (LIFO) the newest song is on top andoldest is dropped automaticallyonce theres more than 10.
addToupnext(songid) that adds a song to the upnext queue.
playnext() that plays the first song in the queue. If the queue is empty it returns None, so that milestone 1 can take over from there.
back() which replyas the most recent song from history and removes it from history.
onplaylistsongplayed(id) records a songplayed by the playlist.

DESIGN.
deque gives 0(1) at both ends, while list.pop(8) would be O(n)
when song starts, the previous current song is pushed to history, this means history holds song played before current one, so back never replays the song thats already playing.

TESTING.
the builtin test gave the expected output:
playnext() returned s5, then s6 then none.
back() return S5 then S1 then none.
After 15 songs were played, history held exactly 10.

LIMITATIONS.
it doesnt check that a song ID exists in the playlist,milestone 1 hash map could do this check.
duplicates are allowed in upnext.
back() does not put the song user left back into uptonext.
