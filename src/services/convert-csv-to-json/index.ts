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

    async mapAndSaveData(headerProperties: Record<string, any>, record: string[]) {

        try {
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
        } catch(error) {
            return false;
        }

    }

    async isDBConnectionUp(): Promise<boolean> {
        try {

            const result = await connection.raw('SELECT 1');

            return true;
        }
        catch(error) {
            return false;
        }
    }

    async processCSVToJSON() {

        const applicationRoot = this.config.application.root;

        const csvLoadPath = this.config.csvLoadPath;

    
        if(!await this.isDBConnectionUp()) {

            console.log('[database] Database connection could not be established');

            process.exit();
        }

        const csvDataStream = fs.createReadStream(path.join(applicationRoot, csvLoadPath));

        const rl = readline.createInterface({
            input: csvDataStream,
            crlfDelay: Infinity
        });

        let dataRecords: any = [];

        let headerRecord: any = [];

        

        console.log('[database] Database connection is established');

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

                await this.mapAndSaveData(headerProperties, record);
            }
        });

        rl.on('close', async () => {
            console.log('[analysis] Analysis uploaded records');
            const ageGroupDistribution = await connection.raw(`
                WITH AgeGroups AS (
                    SELECT
                        CASE
                            WHEN age < 20 THEN '< 20'
                            WHEN age BETWEEN 20 AND 40 THEN '20 to 40'
                            WHEN age BETWEEN 40 AND 60 THEN '40 to 60'
                            ELSE '> 60'
                        END AS age_group,
                        COUNT(*) AS group_count
                    FROM
                        users 
                    GROUP BY
                        age_group
                )
                SELECT
                    age_group AS "Age-Group",
                    ROUND((CAST(group_count AS DECIMAL) / (SELECT SUM(group_count) FROM AgeGroups)) * 100, 2) AS "% Distribution"
                FROM
                    AgeGroups;
            `);
            
            const records = ageGroupDistribution.rows;

            console.table(records);
        })
    }
}