
class ArtistGraph {
     constructor() {
         this.adjacencyList = new Map();
     }
 
     addRelation(artistA, artistB) {
         if (!this.adjacencyList.has(artistA)) {
             this.adjacencyList.set(artistA, new Set());
         }
 
         if (!this.adjacencyList.has(artistB)) {
             this.adjacencyList.set(artistB, new Set());
         }
 
         this.adjacencyList.get(artistA).add(artistB);
         this.adjacencyList.get(artistB).add(artistA);
     }
 
     recommendArtists(artist) {
         const direct = this.adjacencyList.get(artist);
 
         if (!direct) return [];
 
         const recommendations = new Set();
 
         for (const neighbor of direct) {
             const neighborsOfNeighbor =
                 this.adjacencyList.get(neighbor) || new Set();
 
             for (const candidate of neighborsOfNeighbor) {
                 if (
                     candidate !== artist &&
                     !direct.has(candidate)
                 ) {
                     recommendations.add(candidate);
                 }
             }
         }
 
         return [...recommendations].sort((a, b) =>
             a.localeCompare(b)
         );
     }
 }
 
 module.exports = ArtistGraph;
 