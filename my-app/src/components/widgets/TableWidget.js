import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  TablePagination,
  CircularProgress,
} from '@mui/material';
import dataService from '../../services/dataService';

const TableWidget = ({ widget, onUpdate }) => {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadData();
  }, [widget.config?.dataSource, page, rowsPerPage]);

  const loadData = async () => {
    setLoading(true);
    try {
      const dataSource = widget.config?.dataSource || 'users';
      const result = await dataService.getTableData(dataSource, page, rowsPerPage);
      setData(result.data);
      setTotal(result.total);
    } catch (error) {
      console.error('Error loading table data:', error);
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };



  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const columns = widget.config?.columns || ['Name', 'Email', 'Status'];

  if (loading) {
    return (
      <Box sx={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        {widget.config?.title || 'Table'}
      </Typography>
      
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <TableContainer component={Paper} sx={{ height: '100%' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {columns.map((column, index) => (
                  <TableCell key={index} sx={{ fontWeight: 'bold' }}>
                    {column}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.email}</TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: 'inline-block',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        backgroundColor: row.status === 'Active' ? '#e8f5e8' : '#ffeaea',
                        color: row.status === 'Active' ? '#2e7d32' : '#d32f2f',
                        fontSize: '0.75rem',
                        fontWeight: 'medium',
                      }}
                    >
                      {row.status}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={total}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        size="small"
      />
    </Box>
  );
};

export default TableWidget; 