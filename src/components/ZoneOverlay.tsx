// Zone Overlay Component - Displays zone on top of camera feed
import React, { useEffect, useRef } from 'react';

function ZoneOverlay({ zone, containerWidth = 1200, containerHeight = 675 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !zone) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (zone.points && zone.points.length > 0) {
      // Draw zone based on type
      ctx.strokeStyle = zone.color || '#ff0000';
      ctx.lineWidth = 3;
      
      if (zone.drawingMode === 'line') {
        // Draw line for line-crossing zones
        ctx.fillStyle = (zone.color || '#ff0000') + '00'; // No fill for lines
        
        ctx.beginPath();
        zone.points.forEach((point, i) => {
          if (i === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        });
        ctx.stroke();
        
        // Draw arrow heads to show direction
        if (zone.points.length >= 2) {
          const p1 = zone.points[zone.points.length - 2];
          const p2 = zone.points[zone.points.length - 1];
          const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
          const arrowLength = 20;
          
          ctx.beginPath();
          ctx.moveTo(p2.x, p2.y);
          ctx.lineTo(
            p2.x - arrowLength * Math.cos(angle - Math.PI / 6),
            p2.y - arrowLength * Math.sin(angle - Math.PI / 6)
          );
          ctx.moveTo(p2.x, p2.y);
          ctx.lineTo(
            p2.x - arrowLength * Math.cos(angle + Math.PI / 6),
            p2.y - arrowLength * Math.sin(angle + Math.PI / 6)
          );
          ctx.stroke();
        }
      } else {
        // Draw polygon or rectangle zones
        ctx.fillStyle = (zone.color || '#ff0000') + '33'; // Add alpha for transparency
        
        ctx.beginPath();
        zone.points.forEach((point, i) => {
          if (i === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Draw zone label
      if (zone.name) {
        // Calculate center of polygon for label
        const centerX = zone.points.reduce((sum, p) => sum + p.x, 0) / zone.points.length;
        const centerY = zone.points.reduce((sum, p) => sum + p.y, 0) / zone.points.length;

        // Draw label background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        const labelWidth = ctx.measureText(zone.name).width + 20;
        ctx.fillRect(centerX - labelWidth / 2, centerY - 15, labelWidth, 30);

        // Draw label text
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(zone.name, centerX, centerY);
      }
    }
  }, [zone, containerWidth, containerHeight]);

  if (!zone) return null;

  return (
    <canvas
      ref={canvasRef}
      width={containerWidth}
      height={containerHeight}
      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto' }}
    />
  );
}

export default ZoneOverlay;