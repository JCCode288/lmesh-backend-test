import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class ReportDto {
    @ApiProperty({ type: 'string', format: 'binary' })
    file: any;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    partNumber: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    plantCode: string;
}

export class AnalysisDto {

}

