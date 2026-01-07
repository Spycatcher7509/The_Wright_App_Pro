import Foundation

// A lightweight wrapper around the SendGrid API.
public class SendGridService {
    private let apiKey: String
    private let session: URLSession

    public init(apiKey: String = ProcessInfo.processInfo.environment["SENDGRID_API_KEY"] ?? "", session: URLSession = .shared) {
        self.apiKey = apiKey
        self.session = session
    }

    // Generic method to perform API requests
    private func performRequest(endpoint: String, completion: @escaping (Result<Data, Error>) -> Void) {
        guard let url = URL(string: "https://api.sendgrid.com/v3\(endpoint)") else {
            completion(.failure(NSError(domain: "SendGridService", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid URL"])))
            return
        }
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")

        let task = session.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            guard let data = data else {
                completion(.failure(NSError(domain: "SendGridService", code: -2, userInfo: [NSLocalizedDescriptionKey: "No data returned"])))
                return
            }
            completion(.success(data))
        }
        task.resume()
    }

    /// Fetches recent email logs from the SendGrid API.
    /// This method fetches email activity logs. See https://docs.sendgrid.com/api-reference/sendgrid/v3
    public func fetchEmailLogs(limit: Int = 50, completion: @escaping (Result<Data, Error>) -> Void) {
        let endpoint = "/messages?limit=\(limit)"
        performRequest(endpoint: endpoint, completion: completion)
    }
}

#if DEBUG
import XCTest

/// Unit test skeleton for SendGridService.
/// Note: Implement proper assertions and mocking for network calls.
final class SendGridServiceTests: XCTestCase {

    func testFetchEmailLogs() {
        let expectation = self.expectation(description: "Fetch logs")
        let service = SendGridService(apiKey: "TEST_API_KEY", session: URLSession(configuration: .ephemeral))
        service.fetchEmailLogs { result in
            // TODO: Validate result and parse JSON as needed.
            expectation.fulfill()
        }
        waitForExpectations(timeout: 5.0)
    }
}
#endif
