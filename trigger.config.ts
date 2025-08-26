import { defineConfig } from '@trigger.dev/sdk/v3';
import { prismaExtension } from '@trigger.dev/build/extensions/prisma';

export default defineConfig({
	project: 'proj_firymfvtbehtofpitjlt',
	runtime: 'node',
	logLevel: 'log',
	// The max compute seconds a task is allowed to run. If the task run exceeds this duration, it will be stopped.
	// You can override this on an individual task.
	// See https://trigger.dev/docs/runs/max-duration
	maxDuration: 3600,
	// Use small machine since we've optimized memory usage
	machine: 'small-2x', // Options: small-1x, medium-1x, large-1x, xlarge-1x
	retries: {
		enabledInDev: true,
		default: {
			maxAttempts: 3,
			minTimeoutInMs: 1000,
			maxTimeoutInMs: 10000,
			factor: 2,
			randomize: true,
		},
	},
	dirs: ['./src/trigger'],
	build: {
		extensions: [
			prismaExtension({
				schema: 'prisma/schema.prisma',
			}),
		],
	},
});
