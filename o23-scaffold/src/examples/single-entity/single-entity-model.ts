import {Column, Entity, PrimaryColumn} from 'typeorm';

@Entity({name: 'T_SINGLE_ENTITY'})
export class SingleEntity {
	/**
	 * because of number restriction, declare the column type to be varchar,
	 * it is tested in better-sqlite3.
	 */
	@PrimaryColumn('varchar', {name: 'ID'})
	id: bigint;
	@Column('varchar', {name: 'CODE'})
	code: string;
	@Column('varchar', {name: 'NAME'})
	name: string;
}
