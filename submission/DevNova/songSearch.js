class BSTNode {
     constructor(title, songId) {
         this.title = title;
         this.songIds = [songId];
         this.left = null;
         this.right = null;
     }
 }
 
 class SongSearchBST {
     constructor() {
         this.root = null;
     }
 
     addSong(title, songId) {
         if (!title || songId === undefined || songId === null) {
             throw new Error("Title and songId are required");
         }
 
         const key = title.toLowerCase().trim();
 
         const insert = (node) => {
             if (!node) return new BSTNode(title.trim(), songId);
 
             const nodeKey = node.title.toLowerCase();
 
             if (key < nodeKey) {
                 node.left = insert(node.left);
             } else if (key > nodeKey) {
                 node.right = insert(node.right);
             } else if (!node.songIds.includes(songId)) {
                 node.songIds.push(songId);
             }
 
             return node;
         };
 
         this.root = insert(this.root);
     }
 
     findSong(title) {
         const key = title.toLowerCase().trim();
         let node = this.root;
 
         while (node) {
             const nodeKey = node.title.toLowerCase();
 
             if (key === nodeKey) return node.songIds[0];
             node = key < nodeKey ? node.left : node.right;
         }
 
         return null;
     }
 

     prefixSearch(prefix) {
         return this.prefixSearchWithIds(prefix).map(result => result.title);
     }
 
     
     prefixSearchWithIds(prefix) {
         const key = prefix.toLowerCase().trim();
         const results = [];
 
         const search = (node) => {
             if (!node) return;
 
             const nodeKey = node.title.toLowerCase();
 

             if (key <= nodeKey) {
                 search(node.left);
             }
 
             if (nodeKey.startsWith(key)) {
                 for (const songId of node.songIds) {
                     results.push({
                         title: node.title,
                         songId
                     });
                 }
             }
 
             if (key >= nodeKey || nodeKey.startsWith(key)) {
                 search(node.right);
             }
         };
 
         search(this.root);
         return results;
     }
 }
 
 module.exports = SongSearchBST;