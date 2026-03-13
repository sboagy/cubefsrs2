export type Quaternion = { x: number; y: number; z: number; w: number };
export type AngularVelocity = { x: number; y: number; z: number };

export interface DeviceInfo {
	name?: string;
	id?: string;
	battery?: number;
	supportsGyro?: boolean;
}

export interface DeviceState {
	connected: boolean;
	connecting: boolean;
	info: DeviceInfo;
	quaternion?: Quaternion;
	angularVelocity?: AngularVelocity;
	lastMove?: string;
	facelets?: string;
	lastMoveAt?: number;
	autoReconnect?: boolean;
}
