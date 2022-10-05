import { CharacterStateBase } from './_stateLibrary';
import { ICharacterState } from '../../interfaces/ICharacterState';
import { Character } from '../Character';
export declare class Falling extends CharacterStateBase implements ICharacterState {
    allreadyJumped: boolean;
    constructor(character: Character, allreadyJumped?: boolean);
    update(timeStep: number): void;
}
