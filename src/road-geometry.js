/** Smooth deterministic terrain: +Z is travel direction; y=0 at the start line. */
export function roadX(z){
  return Math.sin(z*.009)*9+Math.sin(z*.022)*2.7+Math.sin(z*.0039)*4.1;
}
export function roadTangent(z){
  return .081*Math.cos(z*.009)+.0594*Math.cos(z*.022)+.01599*Math.cos(z*.0039);
}
export function roadY(z,mapId='forest'){
  const gain=mapId==='coast'?.57:mapId==='night'?.83:1;
  return gain*(1.55*Math.sin(z*.014)+.70*Math.sin(z*.033)+.24*Math.sin(z*.071));
}
export function roadGrade(z,mapId='forest'){
  const gain=mapId==='coast'?.57:mapId==='night'?.83:1;
  return gain*(1.55*.014*Math.cos(z*.014)+.70*.033*Math.cos(z*.033)+.24*.071*Math.cos(z*.071));
}
/** Correct uphill grade sign for a road geometry whose long axis is local Z. */
export function roadPitch(z,mapId){return -Math.atan(roadGrade(z,mapId))}
