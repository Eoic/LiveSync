export class Serializer {
    public static snakeToCamel = (data: any): any => {
        if (typeof data !== 'object' || data === null) {
            return data;
        }
    
        if (Array.isArray(data)) {
            return data.map((item) => Serializer.snakeToCamel(item));
        }
    
        return Object.keys(data).reduce((acc: Record<string, any>, key: string) => {
            const camelKey = key.replace(/_./g, match => match.charAt(1).toUpperCase());
            acc[camelKey] = Serializer.snakeToCamel(data[key]);
            return acc;
        }, {});
    };

    public static camelToSnake(data: any): any {
        if (typeof data !== 'object' || data === null) {
            return data;
        }
    
        if (Array.isArray(data)) {
            return data.map((item) => Serializer.camelToSnake(item));
        }
    
        return Object.keys(data).reduce((acc: Record<string, any>, key: string) => {
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            acc[snakeKey] = Serializer.camelToSnake(data[key]);
            return acc;
        }, {});
    }
}
