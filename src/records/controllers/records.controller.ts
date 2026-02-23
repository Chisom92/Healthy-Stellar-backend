import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RecordsService } from '../services/records.service';
import { RecordResponseDto } from '../dto/record-response.dto';

@ApiTags('Records')
@Controller('records')
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get record by ID with access control verification',
    description: 'Verifies requester has valid access grant via Soroban contract before fetching encrypted blob from IPFS'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Record retrieved successfully',
    type: RecordResponseDto
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Access denied to this record' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Record not found' 
  })
  async getRecord(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<RecordResponseDto> {
    const requesterId = req.user?.id || '00000000-0000-0000-0000-000000000000';
    return this.recordsService.getRecord(id, requesterId);
  }
}
