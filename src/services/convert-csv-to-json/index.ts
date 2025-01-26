import ConfigLoader, { IConfigs } from "../../libs/config";
import fs from 'fs';
import * as readline from 'node:readline';
import * as path from 'path';
import connection from "../../libs/database";

export class ConvertCSVToJSONService {

    private config: IConfigs = {} as IConfigs;

    constructor() {

        this.config = new ConfigLoader().load();

    }

    removeExtraSpaces(arg: string) {
        return arg.trim().replace(/\s+/g, ' ');
    }

    // Recursive function to map data based on the structure
    mapData(structure: Record<string, any>, dataRecord: string[]): Record<string, any> {
        const mappedData: Record<string, any> = {};
    
        for (let key in structure) {
            if (typeof structure[key] === 'number') {
                mappedData[key] = dataRecord[structure[key]]?.trim();
            }
                
            if (typeof structure[key] === 'object') {
                mappedData[key] = this.mapData(structure[key], dataRecord); 
            }
        }

        return mappedData; 
    }

    createRecordIndexStructure(headerRecord: string[]): Record<string, any> {

        let index = 0;

        let structure: Record<string, any> = {};

        for (const field of headerRecord) {

            const splitFields = field.split('.');

            let currentLevel: Record<string, any> = structure;

            for (let i = 0; i < splitFields.length; i++) {

                const nestedField = splitFields[i].toLowerCase().trim();

                if (i === splitFields.length - 1) {

                    // If this the last element, we are assuming the parent
                    // object has been created, if not then create
                    // the parent properties first
                    currentLevel[nestedField] = index;

                    index++;

                } else {

                    if (!currentLevel[nestedField]) {
                        currentLevel[nestedField] = {};
                    }

                    currentLevel = currentLevel[nestedField];
                }
            }
        }

        return structure;
    }



    async processCSVToJSON() {

        const applicationRoot = this.config.application.root;

        const csvLoadPath = this.config.csvLoadPath;

        const csvDataStream = fs.createReadStream(path.join(applicationRoot, csvLoadPath));

        const rl = readline.createInterface({
            input: csvDataStream,
            crlfDelay: Infinity
        });

        let dataRecords: any = [];

        let headerRecord: any = [];

        

        rl.on('line', async (line) => {

            let isHeaderRecord = false;

            const record: string[] = line.split(',');

            if (!headerRecord.length) {
                headerRecord = [...record];
                isHeaderRecord = true;
            }

            const headerProperties = this.createRecordIndexStructure(headerRecord);

            if (!isHeaderRecord) {
            
            dataRecords.push(record);

            const mappedData = this.mapData(headerProperties, record);

            const {
                name,
                age,
                address,
                ...additionalInfo
            } = mappedData;


            await connection('users').insert({
                name: `${mappedData?.name.firstname} ${mappedData?.name.lastname}`,
                age: Number(mappedData?.age) || 0,
                address: mappedData.address,
                additional_info: additionalInfo
            });
            }
        });

        rl.on('close', () => {

        })

    }
}