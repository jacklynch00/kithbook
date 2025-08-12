'use client';

import { useEffect, useState, useRef } from 'react';
import { GraphCanvas, GraphNode, GraphEdge, useSelection, lightTheme } from 'reagraph';
import { NetworkGraphData, NetworkNode, NetworkEdge } from '@/lib/services/network-graph-service';
import { Button } from '@/components/ui/button';
import { Target } from 'lucide-react';

interface NetworkGraphProps {
	data?: NetworkGraphData;
	isLoading?: boolean;
	compact?: boolean; // For smaller dashboard view
}

export function NetworkGraph({ data, isLoading, compact = false }: NetworkGraphProps) {
	const [hoveredNode, setHoveredNode] = useState<string | null>(null);
	const [showRecenterButton, setShowRecenterButton] = useState(false);
	const graphRef = useRef<any>(null);

	// Convert our data format to Reagraph format
	const nodes: GraphNode[] =
		data?.nodes.map((node) => ({
			id: node.id,
			label: node.label,
			size: node.size,
			fill: node.color,
		})) || [];

	const edges: GraphEdge[] =
		data?.edges.map((edge) => ({
			id: edge.id,
			source: edge.source,
			target: edge.target,
			size: Math.max(edge.weight * 0.5, 1), // Scale edge thickness based on weight
			label: edge.label,
		})) || [];

	const handleNodePointerOver = (node: GraphNode) => {
		setHoveredNode(node.id);
	};

	const handleNodePointerOut = () => {
		setHoveredNode(null);
	};

	const handleRecenterGraph = () => {
		if (graphRef.current) {
			// For now, just center the graph - this we know works
			graphRef.current.centerGraph();
			
			// Log what methods are actually available for future enhancement
			console.log('Available methods:', Object.getOwnPropertyNames(graphRef.current));
			if (graphRef.current.camera) {
				console.log('Camera methods:', Object.getOwnPropertyNames(graphRef.current.camera));
			}
		}
	};

	// Show re-center button after a short delay when data loads
	useEffect(() => {
		if (data && nodes.length > 0) {
			const timer = setTimeout(() => {
				setShowRecenterButton(true);
			}, 2000); // Show button after 2 seconds
			
			return () => clearTimeout(timer);
		}
	}, [data, nodes.length]);

	if (isLoading) {
		return (
			<div className='w-full h-full flex items-center justify-center'>
				<div className='text-lg'>Loading network graph...</div>
			</div>
		);
	}

	if (!data || (nodes.length === 0 && edges.length === 0)) {
		return (
			<div className='w-full h-full flex items-center justify-center'>
				<div className='text-center'>
					<h3 className='text-lg font-medium mb-2'>No Network Data Available</h3>
					<p className='text-muted-foreground'>Your network graph will appear here once you have contacts with shared interactions (group emails or meetings).</p>
				</div>
			</div>
		);
	}

	return (
		<div className='w-full h-full relative'>
			<GraphCanvas
				ref={graphRef}
				nodes={nodes}
				edges={edges}
				theme={lightTheme}
				layoutType='forceDirected2d'
				onNodePointerOver={handleNodePointerOver}
				onNodePointerOut={handleNodePointerOut}
				animated={true}
				sizingType='centrality'
				edgeLabelPosition='natural'
			/>

			{/* Info overlay - only show in full screen mode */}
			{!compact && (
				<div className='absolute top-4 left-4 bg-background/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border max-w-sm'>
					<h4 className='font-medium mb-2'>Network Graph</h4>
					<div className='text-sm text-muted-foreground space-y-1'>
						<p>
							<strong>{nodes.length}</strong> contacts
						</p>
						<p>
							<strong>{edges.length}</strong> connections
						</p>
					</div>

					{hoveredNode && (
						<div className='mt-3 pt-3 border-t'>
							<p className='text-sm'>
								<strong>Hovered:</strong>
								<br />
								{nodes.find((n) => n.id === hoveredNode)?.label}
							</p>
						</div>
					)}
				</div>
			)}

			{/* Legend - only show in full screen mode */}
			{!compact && (
				<div className='absolute top-4 right-4 bg-background/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border'>
					<h5 className='font-medium mb-2'>Legend</h5>
					<div className='text-sm space-y-1'>
						<div className='flex items-center gap-2'>
							<div className='w-3 h-3 rounded-full bg-red-500'></div>
							<span>Very active (20+ interactions)</span>
						</div>
						<div className='flex items-center gap-2'>
							<div className='w-3 h-3 rounded-full bg-orange-500'></div>
							<span>Active (10-19 interactions)</span>
						</div>
						<div className='flex items-center gap-2'>
							<div className='w-3 h-3 rounded-full bg-yellow-500'></div>
							<span>Moderate (5-9 interactions)</span>
						</div>
						<div className='flex items-center gap-2'>
							<div className='w-3 h-3 rounded-full bg-blue-500'></div>
							<span>Less active (&lt;5 interactions)</span>
						</div>
					</div>
				</div>
			)}

			{/* Compact mode: Show hovered node info as tooltip */}
			{compact && hoveredNode && (
				<div className='absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm rounded-lg p-2 shadow-lg border text-sm'>
					<strong>{nodes.find((n) => n.id === hoveredNode)?.label}</strong>
				</div>
			)}

			{/* Re-center button */}
			{showRecenterButton && (
				<div className='absolute bottom-4 right-4'>
					<Button
						onClick={handleRecenterGraph}
						variant='secondary'
						size='sm'
						className='bg-background/95 backdrop-blur-sm shadow-lg border flex items-center gap-2'>
						<Target className='w-4 h-4' />
						Reset View
					</Button>
				</div>
			)}
		</div>
	);
}
