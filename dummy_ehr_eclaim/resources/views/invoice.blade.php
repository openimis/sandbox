<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice #{{ $invoiceData['order_number'] }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            font-size: 14px;
            color: #333;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            border: 1px solid #ddd;
            padding: 20px;
            background: #fff;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .header p {
            margin: 5px 0;
            color: #555;
        }
        .invoice-details {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
        }
        .invoice-details div {
            width: 45%;
        }
        .invoice-details p {
            margin: 5px 0;
        }
        .invoice-details strong {
            color: #000;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background: #f4f4f4;
            font-weight: bold;
        }
        .totals {
            text-align: right;
        }
        .totals p {
            margin: 5px 0;
        }
        .totals strong {
            color: #000;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            color: #555;
        }
        @media print {
            body {
                padding: 0;
            }
            .container {
                border: none;
                padding: 0;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Your Business Name</h1>
            <p>123 Business Street, City, Country</p>
            <p>Phone: (123) 456-7890 | Email: contact@business.com</p>
            <h2>INVOICE</h2>
        </div>

        <div class="invoice-details">
            <div>
                <p><strong>Invoice #:</strong> {{ $invoiceData['order_number'] }}</p>
                <p><strong>Created:</strong> {{ $invoiceData['created_date'] }}</p>
            </div>
            <div>
                <p><strong>Customer:</strong> {{ $invoiceData['customer']['name'] }}</p>
                <p><strong>Phone:</strong> {{ $invoiceData['customer']['phone'] }}</p>
                <p><strong>Email:</strong> {{ $invoiceData['customer']['email'] }}</p>
                <p><strong>Payment Method:</strong> {{ ucfirst($invoiceData['payment_method']) }}</p>
                <p><strong>Status:</strong> {{ $invoiceData['status'] }}</p>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Price</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($invoiceData['items'] as $item)
                    <tr>
                        <td>{{ $item['product_name'] }} ({{ $item['quantity'] }} × ${{ number_format($item['selling_price'], 2) }})</td>
                        <td>${{ number_format($item['total'], 2) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <div class="totals">
            <p><strong>Subtotal:</strong> ${{ number_format($invoiceData['sub_total'], 2) }}</p>
            <p><strong>Tax:</strong> ${{ number_format($invoiceData['tax_total'], 2) }}</p>
            <p><strong>Discount:</strong> ${{ number_format($invoiceData['discount_total'], 2) }}</p>
            <p><strong>Total:</strong> ${{ number_format($invoiceData['total'], 2) }}</p>
            <p><strong>Paid:</strong> ${{ number_format($invoiceData['paid'], 2) }}</p>
            <p><strong>Change:</strong> ${{ number_format($invoiceData['change'], 2) }}</p>
        </div>

        <div class="footer">
            <p>Thank you for your business!</p>
        </div>
    </div>
</body>
</html>